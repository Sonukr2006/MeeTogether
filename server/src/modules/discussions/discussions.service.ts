import { Injectable, NotFoundException } from '@nestjs/common';
import { TtlCache } from 'src/common/utils/ttl-cache';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateMessageDto } from './dto/create-message.dto';

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

  async getThreadsForProject(projectId: string, userId?: string) {
    const cacheKey = userId ? `${projectId}:${userId}` : projectId;
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
        participantStates: userId
          ? {
              where: { userId },
              select: {
                unreadCountSnapshot: true,
              },
              take: 1,
            }
          : false,
        _count: {
          select: {
            messages: true,
          },
        },
      },
      orderBy: [{ lastMessageAt: 'desc' }, { createdAt: 'asc' }],
    });

    const mapped = await Promise.all(
      threads.map(async (thread) => {
        const participantState = thread.participantStates?.[0];
        const unreadCount =
          userId
            ? participantState?.unreadCountSnapshot ?? thread._count.messages
            : 0;

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
      }),
    );

    this.projectThreadsCache.set(cacheKey, mapped);
    return mapped;
  }

  async getMessagesForThread(threadId: string) {
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
}
