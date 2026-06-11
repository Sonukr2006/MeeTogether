import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { TtlCache } from 'src/common/utils/ttl-cache';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateMessageDto } from './dto/create-message.dto';

type ProjectDiscussionAccess = {
  ownerUserId: string;
  visibility: string;
  members: Array<{ id: string }>;
};

type ThreadDiscussionAccess = {
  createdByUserId: string;
  project: ProjectDiscussionAccess;
};

@Injectable()
export class DiscussionsService {
  private readonly projectThreadsCache = new TtlCache<
    {
      id: string;
      projectId: string;
      title: string;
      createdBy: string;
      createdByUser: { id: string; name: string };
      lastActivity: Date;
      messageCount: number;
      unreadCount: number;
      hasUnread: boolean;
      lastMessagePreview: string | null;
    }[]
  >(30_000);
  private readonly threadMessagesCache = new TtlCache<
    {
      id: string;
      threadId: string;
      author: string;
      authorUser: { id: string; name: string };
      role: string;
      message: string;
      sentAt: Date;
    }[]
  >(30_000);

  constructor(private readonly prisma: PrismaService) {}

  async getThreadsForProject(projectId: string, userId: string) {
    await this.ensureCanViewProjectDiscussions(projectId, userId);

    const cacheKey = `${projectId}:${userId}`;
    const cached = this.projectThreadsCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const threads = await this.prisma.discussionThread.findMany({
      where: { projectId },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
        messages: {
          orderBy: [{ sequenceNumber: 'desc' }, { createdAt: 'desc' }],
          take: 1,
          select: {
            message: true,
          },
        },
        participantStates: {
          where: { userId },
          select: {
            unreadCountSnapshot: true,
          },
          take: 1,
        },
        _count: {
          select: {
            messages: true,
          },
        },
      },
      orderBy: [{ lastMessageAt: 'desc' }, { createdAt: 'asc' }],
    });

    const mapped = threads.map((thread) => {
      const participantState = thread.participantStates?.[0];
      const unreadCount =
        participantState?.unreadCountSnapshot ?? thread._count.messages;

      return {
        id: thread.id,
        projectId: thread.projectId,
        title: thread.title,
        createdBy: thread.createdBy.name,
        createdByUser: thread.createdBy,
        lastActivity: thread.lastMessageAt ?? thread.createdAt,
        messageCount: thread._count.messages,
        unreadCount,
        hasUnread: unreadCount > 0,
        lastMessagePreview: thread.messages[0]?.message ?? null,
      };
    });

    this.projectThreadsCache.set(cacheKey, mapped);
    return mapped;
  }

  async getMessagesForThread(threadId: string, userId: string) {
    await this.ensureCanViewThread(threadId, userId);

    const cached = this.threadMessagesCache.get(threadId);
    if (cached) {
      return cached;
    }

    const thread = await this.prisma.discussionThread.findUnique({
      where: { id: threadId },
      include: {
        messages: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                title: true,
              },
            },
          },
          orderBy: [{ sequenceNumber: 'asc' }, { createdAt: 'asc' }],
        },
      },
    });

    if (!thread) {
      throw new NotFoundException('Discussion thread not found');
    }

    const mapped = thread.messages.map((message) => ({
      id: message.id,
      threadId: thread.id,
      author: message.author.name,
      authorUser: {
        id: message.author.id,
        name: message.author.name,
      },
      role: message.author.title ?? 'Builder',
      message: message.message,
      sentAt: message.createdAt,
    }));

    this.threadMessagesCache.set(threadId, mapped);
    return mapped;
  }

  async createMessage(threadId: string, userId: string, createMessageDto: CreateMessageDto) {
    await this.ensureCanPostThreadMessage(threadId, userId);

    const thread = await this.prisma.discussionThread.findUnique({
      where: { id: threadId },
      include: {
        _count: {
          select: {
            messages: true,
          },
        },
      },
    });

    if (!thread) {
      throw new NotFoundException('Discussion thread not found');
    }

    const message = await this.prisma.discussionMessage.create({
      data: {
        threadId,
        authorUserId: userId,
        message: createMessageDto.message,
        sequenceNumber: thread._count.messages + 1,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            title: true,
          },
        },
      },
    });

    await this.prisma.discussionThread.update({
      where: { id: threadId },
      data: {
        lastMessageAt: message.createdAt,
      },
    });

    await this.prisma.threadParticipantState.upsert({
      where: {
        threadId_userId: {
          threadId,
          userId,
        },
      },
      update: {
        lastReadAt: message.createdAt,
        lastReadMessageId: message.id,
        unreadCountSnapshot: 0,
      },
      create: {
        threadId,
        userId,
        lastReadAt: message.createdAt,
        lastReadMessageId: message.id,
        unreadCountSnapshot: 0,
      },
    });

    await this.prisma.threadParticipantState.updateMany({
      where: {
        threadId,
        userId: {
          not: userId,
        },
      },
      data: {
        unreadCountSnapshot: {
          increment: 1,
        },
      },
    });

    this.threadMessagesCache.clear(threadId);
    this.projectThreadsCache.clear();

    return {
      id: message.id,
      threadId,
      author: message.author.name,
      authorUser: {
        id: message.author.id,
        name: message.author.name,
      },
      role: message.author.title ?? 'Builder',
      message: message.message,
      sentAt: message.createdAt,
    };
  }

  async markThreadRead(threadId: string, userId: string) {
    await this.ensureCanViewThread(threadId, userId);

    const latestMessage = await this.prisma.discussionMessage.findFirst({
      where: { threadId },
      orderBy: [{ sequenceNumber: 'desc' }, { createdAt: 'desc' }],
    });

    await this.prisma.threadParticipantState.upsert({
      where: {
        threadId_userId: {
          threadId,
          userId,
        },
      },
      update: {
        lastReadAt: new Date(),
        lastReadMessageId: latestMessage?.id,
        unreadCountSnapshot: 0,
      },
      create: {
        threadId,
        userId,
        lastReadAt: new Date(),
        lastReadMessageId: latestMessage?.id,
        unreadCountSnapshot: 0,
      },
    });

    this.projectThreadsCache.clear();

    return { success: true };
  }

  private async ensureCanViewProjectDiscussions(projectId: string, userId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: {
        ownerUserId: true,
        visibility: true,
        members: {
          where: { userId },
          select: { id: true },
          take: 1,
        },
      },
    });

    if (!project || !this.canViewProjectDiscussions(project, userId)) {
      throw new NotFoundException('Project discussions not found');
    }
  }

  private async ensureCanViewThread(threadId: string, userId: string) {
    const thread = await this.findThreadAccess(threadId, userId);

    if (!thread || !this.canViewThread(thread, userId)) {
      throw new NotFoundException('Discussion thread not found');
    }
  }

  private async ensureCanPostThreadMessage(threadId: string, userId: string) {
    const thread = await this.findThreadAccess(threadId, userId);

    if (!thread) {
      throw new NotFoundException('Discussion thread not found');
    }

    if (!this.canPostThreadMessage(thread, userId)) {
      throw new ForbiddenException('You are not allowed to post in this discussion.');
    }
  }

  private findThreadAccess(threadId: string, userId: string) {
    return this.prisma.discussionThread.findUnique({
      where: { id: threadId },
      select: {
        createdByUserId: true,
        project: {
          select: {
            ownerUserId: true,
            visibility: true,
            members: {
              where: { userId },
              select: { id: true },
              take: 1,
            },
          },
        },
      },
    });
  }

  private canViewProjectDiscussions(
    project: ProjectDiscussionAccess,
    userId: string,
  ) {
    return (
      project.visibility === 'public' ||
      project.ownerUserId === userId ||
      project.members.length > 0
    );
  }

  private canViewThread(thread: ThreadDiscussionAccess, userId: string) {
    return (
      this.canViewProjectDiscussions(thread.project, userId) ||
      thread.createdByUserId === userId
    );
  }

  private canPostThreadMessage(thread: ThreadDiscussionAccess, userId: string) {
    return (
      thread.createdByUserId === userId ||
      thread.project.ownerUserId === userId ||
      thread.project.members.length > 0
    );
  }
}
