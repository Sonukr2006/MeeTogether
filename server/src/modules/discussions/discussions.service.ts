import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateMessageDto } from './dto/create-message.dto';

@Injectable()
export class DiscussionsService {
  constructor(private readonly prisma: PrismaService) {}

  async getThreadsForProject(projectId: string) {
    const threads = await this.prisma.discussionThread.findMany({
      where: { projectId },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            messages: true,
          },
        },
      },
      orderBy: [{ lastMessageAt: 'desc' }, { createdAt: 'asc' }],
    });

    return threads.map((thread) => ({
      id: thread.id,
      projectId: thread.projectId,
      title: thread.title,
      createdBy: thread.createdBy.name,
      createdByUser: thread.createdBy,
      lastActivity: thread.lastMessageAt ?? thread.createdAt,
      messageCount: thread._count.messages,
    }));
  }

  async getMessagesForThread(threadId: string) {
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

    return thread.messages.map((message) => ({
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
      },
      create: {
        threadId,
        userId,
        lastReadAt: message.createdAt,
        lastReadMessageId: message.id,
      },
    });

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
      },
      create: {
        threadId,
        userId,
        lastReadAt: new Date(),
        lastReadMessageId: latestMessage?.id,
      },
    });

    return { success: true };
  }
}
