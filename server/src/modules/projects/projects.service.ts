import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { CursorPaginationDto } from "src/common/dto/cursor-pagination.dto";
import { PaginatedResponse } from "src/common/interfaces/paginated-response.interface";
import { TtlCache } from "src/common/utils/ttl-cache";
import { LikesService } from "../likes/likes.service";
import { PrismaService } from "src/prisma/prisma.service";
import { CreateProjectDto } from "./dto/create-project.dto";

const projectInclude = {
  owner: {
    select: {
      id: true,
      name: true,
      username: true,
      avatar: true,
      title: true,
    },
  },
  members: {
    include: {
      user: {
        select: {
          id: true,
          name: true,
          username: true,
          avatar: true,
        },
      },
    },
    orderBy: {
      joinedAt: "asc" as const,
    },
  },
  techTags: {
    orderBy: {
      sortOrder: "asc" as const,
    },
  },
  openRoles: {
    orderBy: {
      sortOrder: "asc" as const,
    },
  },
  tags: {
    orderBy: {
      sortOrder: "asc" as const,
    },
  },
} as const;

const projectCommentInclude = {
  author: {
    select: {
      id: true,
      name: true,
      username: true,
      avatar: true,
      title: true,
    },
  },
} as const;

type ProjectWithRelations = Prisma.ProjectGetPayload<{
  include: typeof projectInclude;
}>;

type ProjectCommentWithAuthor = Prisma.ProjectCommentGetPayload<{
  include: typeof projectCommentInclude;
}>;

@Injectable()
export class ProjectsService {
  private readonly projectDetailCache = new TtlCache<
    ReturnType<ProjectsService["toProjectDetail"]>
  >(30_000);
  private readonly projectCommentsCache = new TtlCache<
    ReturnType<ProjectsService["toProjectComment"]>[]
  >(30_000);
  private readonly logger = new Logger(ProjectsService.name);
  private isProcessingQueue = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly likesService: LikesService,
  ) {}

  async getProjects(query: CursorPaginationDto = {}): Promise<PaginatedResponse<ReturnType<ProjectsService["toProjectSummary"]>>> {
    const limit = Math.min(query.limit ?? 20, 50);

    const projects = await this.prisma.project.findMany({
      take: limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
      include: {
        owner: projectInclude.owner,
        techTags: projectInclude.techTags,
        openRoles: projectInclude.openRoles,
        tags: projectInclude.tags,
        _count: {
          select: {
            members: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const hasMore = projects.length > limit;
    const data = hasMore ? projects.slice(0, limit) : projects;
    const summaries = data.map((project) =>
      this.toProjectSummary(
        project as ProjectWithRelations & { _count: { members: number } },
      ),
    );
    const nextCursor = hasMore ? data[data.length - 1].id : null;

    return {
      data: summaries,
      pagination: {
        nextCursor,
        hasMore,
      },
    };
  }

  async createProject(userId: string, createProjectDto: CreateProjectDto) {
    const techStack = this.normalizeStringArray(createProjectDto.techStack);
    const openRoles = this.normalizeStringArray(createProjectDto.openRoles);

    const created = await this.prisma.$transaction(async (tx) => {
      const project = await tx.project.create({
        data: {
          ownerUserId: userId,
          title: createProjectDto.title.trim(),
          problem: createProjectDto.problemStatement.trim(),
          solution: createProjectDto.solutionApproach.trim(),
          image: createProjectDto.imageUrl?.trim() || null,
          progress: 0,
          visibility: createProjectDto.visibility ?? "public",
          difficulty: createProjectDto.difficulty?.trim() || null,
          timeline: createProjectDto.timeline?.trim() || null,
          mentorStatus: createProjectDto.mentorStatus?.trim() || null,
          githubUrl: createProjectDto.githubUrl?.trim() || null,
          demoUrl: createProjectDto.demoUrl?.trim() || null,
        },
      });

      await tx.projectMember.create({
        data: {
          projectId: project.id,
          userId,
          roleLabel: "Owner",
        },
      });

      if (techStack.length > 0) {
        await tx.projectTechTag.createMany({
          data: techStack.map((value, index) => ({
            projectId: project.id,
            value,
            sortOrder: index + 1,
          })),
        });
      }

      if (openRoles.length > 0) {
        await tx.projectOpenRole.createMany({
          data: openRoles.map((value, index) => ({
            projectId: project.id,
            value,
            sortOrder: index + 1,
          })),
        });
      }

      const defaultThread = await tx.discussionThread.create({
        data: {
          projectId: project.id,
          title: `${project.title} discussion`,
          kind: "default",
          createdByUserId: userId,
        },
      });

      await tx.threadParticipantState.create({
        data: {
          threadId: defaultThread.id,
          userId,
        },
      });

      const createdProject = await tx.project.findUniqueOrThrow({
        where: { id: project.id },
        include: {
          owner: projectInclude.owner,
          techTags: projectInclude.techTags,
          openRoles: projectInclude.openRoles,
          tags: projectInclude.tags,
          _count: {
            select: {
              members: true,
            },
          },
        },
      });

      return {
        id: project.id,
        title: project.title,
        defaultThreadId: defaultThread.id,
        project: this.toProjectSummary(
          createdProject as ProjectWithRelations & {
            _count: { members: number };
          },
        ),
      };
    });

    this.projectDetailCache.clear(created.id);

    return created;
  }

  async getProjectById(projectId: string) {
    const cached = this.projectDetailCache.get(projectId);
    if (cached) {
      return cached;
    }

    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: projectInclude,
    });

    if (!project) {
      throw new NotFoundException("Project not found");
    }

    const detail = this.toProjectDetail(project);
    this.projectDetailCache.set(projectId, detail);
    return detail;
  }

  async getComments(projectId: string, dto?: CursorPaginationDto): Promise<PaginatedResponse<ReturnType<ProjectsService['toProjectComment']>>> {
    const limit = Math.min(dto?.limit ?? 30, 50);

    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true },
    });

    if (!project) {
      throw new NotFoundException("Project not found");
    }

    const comments = await this.prisma.projectComment.findMany({
      where: { projectId },
      include: projectCommentInclude,
      orderBy: [{ createdAt: "asc" }],
      take: limit + 1,
      ...(dto?.cursor ? { cursor: { id: dto.cursor }, skip: 1 } : {}),
    });

    const hasMore = comments.length > limit;
    const data = hasMore ? comments.slice(0, limit) : comments;
    const nextCursor = hasMore ? data[data.length - 1].id : null;

    return {
      data: data.map((comment) => this.toProjectComment(comment)),
      pagination: { nextCursor, hasMore },
    };
  }

  async createComment(projectId: string, userId: string, message: string) {
    const created = await this.prisma.$transaction(async (tx) => {
      const project = await tx.project.findUnique({
        where: { id: projectId },
        select: { id: true },
      });

      if (!project) {
        throw new NotFoundException("Project not found");
      }

      const comment = await tx.projectComment.create({
        data: {
          projectId,
          authorUserId: userId,
          message: message.trim(),
        },
        include: projectCommentInclude,
      });

      const updated = await tx.project.update({
        where: { id: projectId },
        data: {
          commentsCount: {
            increment: 1,
          },
        },
        select: {
          commentsCount: true,
        },
      });

      return {
        comment,
        commentsCount: updated.commentsCount,
      };
    });

    this.projectCommentsCache.clear(projectId);
    this.projectDetailCache.clear(projectId);

    return {
      comment: this.toProjectComment(created.comment),
      commentsCount: created.commentsCount,
    };
  }

  async setLikeState(projectId: string, userId: string, liked: boolean) {
    if (!this.likesService.isQueueEnabled()) {
      return this.applyLikeState(projectId, userId, liked);
    }

    await this.likesService.enqueue({
      entityType: "project",
      entityId: projectId,
      userId,
      liked,
    });

    void this.processQueuedLikes();

    return {
      projectId,
      liked,
      queued: true,
    };
  }

  async applyLikeState(projectId: string, userId: string, liked: boolean) {
    const result = await this.prisma.$transaction(async (tx) => {
      const project = await tx.project.findUnique({
        where: { id: projectId },
        select: { id: true },
      });

      if (!project) {
        throw new NotFoundException("Project not found");
      }

      const existing = await tx.projectLike.findUnique({
        where: {
          projectId_userId: {
            projectId,
            userId,
          },
        },
      });

      if (existing && !liked) {
        await tx.projectLike.delete({
          where: { id: existing.id },
        });

        await tx.$executeRaw`UPDATE "Project" SET "likesCount" = GREATEST("likesCount" - 1, 0), "updatedAt" = NOW() WHERE id = ${projectId} AND "likesCount" > 0`;

        const current = await tx.project.findUniqueOrThrow({
          where: { id: projectId },
          select: { likesCount: true },
        });

        return {
          liked: false,
          likesCount: current.likesCount,
        };
      }

      if (existing && liked) {
        const current = await tx.project.findUniqueOrThrow({
          where: { id: projectId },
          select: { likesCount: true },
        });

        return {
          liked: true,
          likesCount: current.likesCount,
        };
      }

      if (!existing && !liked) {
        const current = await tx.project.findUniqueOrThrow({
          where: { id: projectId },
          select: { likesCount: true },
        });

        return {
          liked: false,
          likesCount: current.likesCount,
        };
      }

      await tx.projectLike.create({
        data: {
          projectId,
          userId,
        },
      });

      const updated = await tx.project.update({
        where: { id: projectId },
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

    this.projectDetailCache.clear(projectId);

    return {
      projectId,
      ...result,
    };
  }

  async setSaveState(projectId: string, userId: string, saved: boolean) {
    const result = await this.prisma.$transaction(async (tx) => {
      const project = await tx.project.findUnique({
        where: { id: projectId },
        select: { id: true },
      });

      if (!project) {
        throw new NotFoundException("Project not found");
      }

      const existing = await tx.projectSave.findUnique({
        where: {
          projectId_userId: {
            projectId,
            userId,
          },
        },
      });

      if (existing && !saved) {
        await tx.projectSave.delete({
          where: { id: existing.id },
        });

        return false;
      }

      if (!existing && saved) {
        await tx.projectSave.create({
          data: {
            projectId,
            userId,
          },
        });

        return true;
      }

      return Boolean(existing);
    });

    return {
      projectId,
      saved: result,
    };
  }

  private async processQueuedLikes() {
    if (this.isProcessingQueue) {
      return;
    }

    this.isProcessingQueue = true;

    try {
      for (let index = 0; index < 20; index += 1) {
        const intent = await this.likesService.popIntent("project");
        if (!intent) {
          break;
        }

        try {
          await this.applyLikeState(
            intent.entityId,
            intent.userId,
            intent.liked,
          );
        } catch (error) {
          if (error instanceof NotFoundException) {
            this.logger.warn(
              `Skipping queued project like for missing project ${intent.entityId}`,
            );
            continue;
          }

          throw error;
        }
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "unknown queue failure";
      this.logger.warn(`Project likes queue processing failed: ${message}`);
    } finally {
      this.isProcessingQueue = false;
    }
  }

  private toProjectSummary(
    project: ProjectWithRelations & { _count?: { members: number } },
  ) {
    return {
      id: project.id,
      createdAt: project.createdAt,
      title: project.title,
      problem: project.problem,
      solution: project.solution,
      image: project.image,
      progress: project.progress,
      difficulty: project.difficulty,
      timeline: project.timeline,
      mentorStatus: project.mentorStatus,
      githubUrl: project.githubUrl,
      demoUrl: project.demoUrl,
      likes: project.likesCount,
      comments: project.commentsCount,
      owner: project.owner,
      contributorsCount: project._count?.members ?? project.members.length,
      techStack: project.techTags.map(
        (tag: ProjectWithRelations["techTags"][number]) => tag.value,
      ),
      openRoles: project.openRoles.map(
        (role: ProjectWithRelations["openRoles"][number]) => role.value,
      ),
      tags: project.tags.map(
        (tag: ProjectWithRelations["tags"][number]) => tag.value,
      ),
    };
  }

  private toProjectDetail(project: ProjectWithRelations) {
    return {
      id: project.id,
      title: project.title,
      problem: project.problem,
      solution: project.solution,
      image: project.image,
      progress: project.progress,
      visibility: project.visibility,
      difficulty: project.difficulty,
      timeline: project.timeline,
      mentorStatus: project.mentorStatus,
      githubUrl: project.githubUrl,
      demoUrl: project.demoUrl,
      likes: project.likesCount,
      comments: project.commentsCount,
      owner: project.owner,
      members: project.members.map(
        (member: ProjectWithRelations["members"][number]) => ({
          id: member.user.id,
          name: member.user.name,
          username: member.user.username,
          avatar: member.user.avatar,
          roleLabel: member.roleLabel,
          joinedAt: member.joinedAt,
        }),
      ),
      techStack: project.techTags.map(
        (tag: ProjectWithRelations["techTags"][number]) => tag.value,
      ),
      openRoles: project.openRoles.map(
        (role: ProjectWithRelations["openRoles"][number]) => role.value,
      ),
      tags: project.tags.map(
        (tag: ProjectWithRelations["tags"][number]) => tag.value,
      ),
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    };
  }

  private toProjectComment(comment: ProjectCommentWithAuthor) {
    return {
      id: comment.id,
      projectId: comment.projectId,
      message: comment.message,
      createdAt: comment.createdAt,
      author: {
        id: comment.author.id,
        name: comment.author.name,
        username: comment.author.username,
        avatar: comment.author.avatar,
        title: comment.author.title ?? "Builder",
      },
    };
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
}
