import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { RequestStatusValue } from './dto/update-request-status.dto';

@Injectable()
export class RequestsService {
  constructor(private readonly prisma: PrismaService) {}

  async getInboxForUser(userId: string) {
    const requests = await this.prisma.request.findMany({
      where: {
        toUserId: userId,
      },
      include: {
        fromUser: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
            title: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return requests.map((request) => this.toRequestInboxItem(request));
  }

  async updateStatusForRecipient(
    requestId: string,
    recipientUserId: string,
    status: RequestStatusValue,
  ) {
    const updated = await this.prisma.request.updateMany({
      where: {
        id: requestId,
        toUserId: recipientUserId,
      },
      data: {
        status,
        unread: false,
      },
    });

    if (updated.count !== 1) {
      throw new NotFoundException('Request not found');
    }

    const request = await this.prisma.request.findUniqueOrThrow({
      where: {
        id: requestId,
      },
      include: {
        fromUser: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
            title: true,
          },
        },
      },
    });

    return this.toRequestInboxItem(request);
  }

  async markAllReadForRecipient(recipientUserId: string) {
    await this.prisma.request.updateMany({
      where: {
        toUserId: recipientUserId,
        unread: true,
      },
      data: {
        unread: false,
      },
    });

    return this.getInboxForUser(recipientUserId);
  }

  private toRequestInboxItem(request: {
    id: string;
    type: string;
    title: string;
    status: string;
    unread: boolean;
    message: string | null;
    relatedProjectId: string | null;
    relatedThreadId: string | null;
    createdAt: Date;
    fromUser: {
      id: string;
      name: string;
      username: string;
      avatar: string | null;
      title: string | null;
    };
  }) {
    return {
      id: request.id,
      type: request.type,
      title: request.title,
      from: request.fromUser.name,
      fromUser: request.fromUser,
      role: request.fromUser.title ?? 'Builder',
      time: this.getRelativeTime(request.createdAt),
      status: request.status,
      unread: request.unread,
      message: request.message,
      relatedProjectId: request.relatedProjectId,
      relatedThreadId: request.relatedThreadId,
      iconKey: this.getIconKey(request.type),
      proof: this.getProofHints(request.type),
    };
  }

  private getIconKey(type: string) {
    switch (type.toLowerCase()) {
      case 'project':
        return 'project';
      case 'mentor':
        return 'mentor';
      case 'internship':
        return 'internship';
      case 'message':
        return 'message';
      case 'resume':
        return 'resume';
      default:
        return 'project';
    }
  }

  private getProofHints(type: string) {
    switch (type.toLowerCase()) {
      case 'project':
        return ['Project room work', 'Collaboration history', 'Shipped work'];
      case 'mentor':
        return ['Build reviews', 'Verified skills', 'Mentor context'];
      case 'internship':
        return ['Proof score', 'Shipped projects', 'Builder profile'];
      case 'message':
        return ['Open to collaboration', 'Visible contribution history'];
      case 'resume':
        return ['Resume activity', 'Demo links', 'Mentor reviews'];
      default:
        return ['Proof attached'];
    }
  }

  private getRelativeTime(date: Date) {
    const diffMs = Date.now() - date.getTime();
    const diffMinutes = Math.max(1, Math.floor(diffMs / 60000));

    if (diffMinutes < 60) {
      return `${diffMinutes} min ago`;
    }

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) {
      return `${diffHours} hr ago`;
    }

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  }
}
