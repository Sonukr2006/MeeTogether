import { Injectable, Logger, NotFoundException, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Prisma, PostType } from '@prisma/client';
import { TtlCache } from 'src/common/utils/ttl-cache';
import { LikesService } from '../likes/likes.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';

const postInclude = {
  author: {
    select: {
      id: true,
      name: true,
      username: true,
      avatar: true,
      title: true,
    },
  },
  project: {
    select: {
      id: true,
      title: true,
    },
  },
  tags: {
    orderBy: {
      sortOrder: 'asc' as const,
    },
  },
  links: {
    orderBy: {
      sortOrder: 'asc' as const,
    },
  },
} as const;

type PostWithRelations = Prisma.PostGetPayload<{
  include: typeof postInclude;
}>;

@Injectable()
export class PostsService implements OnModuleInit, OnModuleDestroy {
  private readonly postsFeedCache = new TtlCache<ReturnType<PostsService['toFeedPost']>[]>(30_000);
  private readonly logger = new Logger(PostsService.name);
  private queueTimer: NodeJS.Timeout | null = null;
  private isProcessingQueue = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly likesService: LikesService,
  ) {}

  onModuleInit() {
    if (!this.likesService.isQueueEnabled()) {
      return;
    }

    this.queueTimer = setInterval(() => {
      void this.processQueuedLikes();
    }, this.likesService.getPollIntervalMs());
  }

  onModuleDestroy() {
    if (this.queueTimer) {
      clearInterval(this.queueTimer);
      this.queueTimer = null;
    }
  }

  async getFeedPosts() {
    const cached = this.postsFeedCache.get('feed');
    if (cached) {
      return cached;
    }

    const posts = await this.prisma.post.findMany({
      include: postInclude,
      orderBy: {
        createdAt: 'desc',
      },
    });

    const mapped = posts.map((post) => this.toFeedPost(post));
    this.postsFeedCache.set('feed', mapped);
    return mapped;
  }

  async createPost(userId: string, createPostDto: CreatePostDto) {
    if (createPostDto.projectId) {
      const project = await this.prisma.project.findUnique({
        where: { id: createPostDto.projectId },
        select: { id: true },
      });

      if (!project) {
        throw new NotFoundException('Linked project not found');
      }
    }

    const normalizedTags = this.normalizeStringArray(createPostDto.tags);
    const normalizedLinks = this.normalizeLinks(createPostDto.links);

    const created = await this.prisma.$transaction(async (tx) => {
      const post = await tx.post.create({
        data: {
          authorUserId: userId,
          projectId: createPostDto.projectId || null,
          type: this.toPostType(createPostDto.type),
          title: createPostDto.title.trim(),
          description: createPostDto.description.trim(),
          imageUrl: createPostDto.imageUrl?.trim() || null,
        },
      });

      if (normalizedTags.length > 0) {
        await tx.postTag.createMany({
          data: normalizedTags.map((value, index) => ({
            postId: post.id,
            value,
            sortOrder: index + 1,
          })),
        });
      }

      if (normalizedLinks.length > 0) {
        await tx.postLink.createMany({
          data: normalizedLinks.map((link, index) => ({
            postId: post.id,
            label: link.label,
            url: link.url,
            sortOrder: index + 1,
          })),
        });
      }

      return tx.post.findUniqueOrThrow({
        where: { id: post.id },
        include: postInclude,
      });
    });

    this.postsFeedCache.clear();
    return this.toFeedPost(created);
  }

  async setLikeState(postId: string, userId: string, liked: boolean) {
    if (!this.likesService.isQueueEnabled()) {
      return this.applyLikeState(postId, userId, liked);
    }

    await this.likesService.enqueue({
      entityType: 'post',
      entityId: postId,
      userId,
      liked,
    });

    return {
      postId,
      liked,
      queued: true,
    };
  }

  async applyLikeState(postId: string, userId: string, liked: boolean) {
    const result = await this.prisma.$transaction(async (tx) => {
      const post = await tx.post.findUnique({
        where: { id: postId },
        select: { id: true },
      });

      if (!post) {
        throw new NotFoundException('Post not found');
      }

      const existing = await tx.postLike.findUnique({
        where: {
          postId_userId: {
            postId,
            userId,
          },
        },
      });

      if (existing && !liked) {
        await tx.postLike.delete({
          where: { id: existing.id },
        });

        const updated = await tx.post.update({
          where: { id: postId },
          data: {
            likesCount: {
              decrement: 1,
            },
          },
          select: {
            likesCount: true,
          },
        });

        return {
          liked: false,
          likesCount: Math.max(0, updated.likesCount),
        };
      }

      if (existing && liked) {
        const current = await tx.post.findUniqueOrThrow({
          where: { id: postId },
          select: { likesCount: true },
        });

        return {
          liked: true,
          likesCount: current.likesCount,
        };
      }

      if (!existing && !liked) {
        const current = await tx.post.findUniqueOrThrow({
          where: { id: postId },
          select: { likesCount: true },
        });

        return {
          liked: false,
          likesCount: current.likesCount,
        };
      }

      await tx.postLike.create({
        data: {
          postId,
          userId,
        },
      });

      const updated = await tx.post.update({
        where: { id: postId },
        data: {
          likesCount: {
            increment: 1,
          },
        },
        select: {
          likesCount: true,
        },
      });

      return {
        liked: true,
        likesCount: updated.likesCount,
      };
    });

    this.postsFeedCache.clear();
    return {
      postId,
      ...result,
    };
  }

  private async processQueuedLikes() {
    if (this.isProcessingQueue) {
      return;
    }

    this.isProcessingQueue = true;

    try {
      for (let index = 0; index < 20; index += 1) {
        const intent = await this.likesService.popIntent('post');
        if (!intent) {
          break;
        }

        try {
          await this.applyLikeState(intent.entityId, intent.userId, intent.liked);
        } catch (error) {
          if (error instanceof NotFoundException) {
            this.logger.warn(`Skipping queued post like for missing post ${intent.entityId}`);
            continue;
          }

          throw error;
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown queue failure';
      this.logger.warn(`Post likes queue processing failed: ${message}`);
    } finally {
      this.isProcessingQueue = false;
    }
  }

  private toFeedPost(post: PostWithRelations) {
    return {
      id: post.id,
      type: this.toUiPostType(post.type),
      title: post.title,
      description: post.description,
      image: post.imageUrl,
      likes: post.likesCount,
      comments: post.commentsCount,
      tags: post.tags.map((tag) => tag.value),
      links: post.links.map((link) => ({
        label: link.label,
        url: link.url,
      })),
      linkedProject: post.project
        ? {
            id: post.project.id,
            title: post.project.title,
          }
        : null,
      user: {
        id: post.author.id,
        name: post.author.name,
        username: post.author.username,
        bio: post.author.title ?? 'Builder',
        avatar: post.author.avatar,
      },
      createdAt: post.createdAt,
    };
  }

  private toPostType(uiType: CreatePostDto['type']): PostType {
    switch (uiType) {
      case 'Build Log':
        return PostType.BUILD_LOG;
      case 'Help Needed':
        return PostType.HELP_NEEDED;
      case 'Mentor Review':
        return PostType.MENTOR_REVIEW;
      case 'Launch':
        return PostType.LAUNCH;
      case 'Professional Update':
        return PostType.PROFESSIONAL_UPDATE;
      default:
        return PostType.BUILD_LOG;
    }
  }

  private toUiPostType(postType: PostType) {
    switch (postType) {
      case PostType.BUILD_LOG:
        return 'Build Log';
      case PostType.HELP_NEEDED:
        return 'Help Needed';
      case PostType.MENTOR_REVIEW:
        return 'Mentor Review';
      case PostType.LAUNCH:
        return 'Launch';
      case PostType.PROFESSIONAL_UPDATE:
        return 'Professional Update';
      default:
        return 'Build Log';
    }
  }

  private normalizeStringArray(values?: string[]) {
    const seen = new Set<string>();

    return (values ?? [])
      .map((value) => value.trim())
      .filter((value) => value.length > 0)
      .filter((value) => {
        const normalized = value.toLowerCase();
        if (seen.has(normalized)) {
          return false;
        }
        seen.add(normalized);
        return true;
      });
  }

  private normalizeLinks(values?: { label: string; url: string }[]) {
    const seen = new Set<string>();

    return (values ?? [])
      .map((value) => ({
        label: value.label.trim(),
        url: value.url.trim(),
      }))
      .filter((value) => value.label.length > 0 && value.url.length > 0)
      .filter((value) => {
        const normalized = `${value.label.toLowerCase()}::${value.url.toLowerCase()}`;
        if (seen.has(normalized)) {
          return false;
        }
        seen.add(normalized);
        return true;
      });
  }
}
