import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class RequestsService {
  constructor(private readonly prisma: PrismaService) {}

  async getRequests(username?: string) {
    const requests = await this.prisma.request.findMany({
      where: username
        ? {
            toUser: {
              username: username.toLowerCase(),
            },
          }
        : undefined,
      include: {
        fromUser: {
          select: {
            id: true,
            name: true,
            title: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return requests.map((request) => ({
      id: request.id,
      type: request.type,
      title: request.title,
      from: request.fromUser.name,
      role: request.fromUser.title ?? 'Builder',
      time: this.getRelativeTime(request.createdAt),
      status: request.status,
      unread: request.unread,
      message: request.message,
      relatedProjectId: request.relatedProjectId,
      relatedThreadId: request.relatedThreadId,
      iconKey: this.getIconKey(request.type),
      proof: this.getProofHints(request.type),
    }));
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
