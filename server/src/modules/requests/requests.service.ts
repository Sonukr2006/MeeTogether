import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateRequestDto } from './dto/create-request.dto';
import { RequestStatusValue } from './dto/update-request-status.dto';

const ACTIVE_REQUEST_STATUSES = ['Pending', 'Replying'] as const;

type NormalizedCreateRequestInput = {
  toUserId: string | null;
  toUsername: string | null;
  type: CreateRequestDto['type'];
  title: string;
  message: string | null;
  relatedProjectId: string | null;
  relatedThreadId: string | null;
};

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

  async getSentForUser(userId: string) {
    const requests = await this.prisma.request.findMany({
      where: {
        fromUserId: userId,
      },
      include: {
        toUser: {
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

    return requests.map((request) => this.toSentRequestItem(request));
  }

  async createRequest(senderUserId: string, createRequestDto: CreateRequestDto) {
    const requestInput = this.normalizeCreateRequestDto(createRequestDto);

    const recipient = await this.findRecipient(requestInput);

    if (recipient.id === senderUserId) {
      throw new BadRequestException('You cannot send a request to yourself.');
    }

    await this.validateRelatedTargets(senderUserId, requestInput);
    await this.ensureNoActiveDuplicateRequest(
      senderUserId,
      recipient.id,
      requestInput,
    );

    try {
      const request = await this.prisma.request.create({
        data: {
          fromUserId: senderUserId,
          toUserId: recipient.id,
          type: requestInput.type,
          title: requestInput.title,
          status: 'Pending',
          message: requestInput.message,
          relatedProjectId: requestInput.relatedProjectId,
          relatedThreadId: requestInput.relatedThreadId,
        },
        include: {
          toUser: {
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

      return this.toSentRequestItem(request);
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException('An active request already exists for this recipient.');
      }

      throw error;
    }
  }

  async cancelSentRequest(requestId: string, senderUserId: string) {
    const updated = await this.prisma.request.updateMany({
      where: {
        id: requestId,
        fromUserId: senderUserId,
        status: {
          in: [...ACTIVE_REQUEST_STATUSES],
        },
      },
      data: {
        status: 'Cancelled',
        unread: false,
      },
    });

    if (updated.count !== 1) {
      await this.throwSentRequestUpdateFailure(requestId, senderUserId);
    }

    const request = await this.prisma.request.findUniqueOrThrow({
      where: {
        id: requestId,
      },
      include: {
        toUser: {
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

    return this.toSentRequestItem(request);
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
        status: {
          in: [...ACTIVE_REQUEST_STATUSES],
        },
      },
      data: {
        status,
        unread: false,
      },
    });

    if (updated.count !== 1) {
      await this.throwReceivedRequestUpdateFailure(requestId, recipientUserId);
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

  private async findRecipient(requestInput: NormalizedCreateRequestInput) {
    const recipient = await this.prisma.user.findFirst({
      where: requestInput.toUserId
        ? { id: requestInput.toUserId }
        : { username: requestInput.toUsername ?? undefined },
      select: {
        id: true,
        name: true,
        username: true,
        avatar: true,
        title: true,
      },
    });

    if (!recipient) {
      throw new NotFoundException('Recipient not found');
    }

    return recipient;
  }

  private normalizeCreateRequestDto(
    createRequestDto: CreateRequestDto,
  ): NormalizedCreateRequestInput {
    const toUserId = this.toNullableString(createRequestDto.toUserId);
    const toUsername = this.toNullableString(
      createRequestDto.toUsername,
    )?.toLowerCase() ?? null;

    if (toUserId && toUsername) {
      throw new BadRequestException('Provide either toUserId or toUsername, not both.');
    }

    if (!toUserId && !toUsername) {
      throw new BadRequestException('A recipient is required.');
    }

    return {
      toUserId,
      toUsername,
      type: createRequestDto.type,
      title: this.normalizeTitle(createRequestDto),
      message: this.toNullableString(createRequestDto.message),
      relatedProjectId: this.toNullableString(createRequestDto.relatedProjectId),
      relatedThreadId: this.toNullableString(createRequestDto.relatedThreadId),
    };
  }

  private async validateRelatedTargets(
    senderUserId: string,
    requestInput: NormalizedCreateRequestInput,
  ) {
    if (requestInput.relatedProjectId) {
      const project = await this.prisma.project.findUnique({
        where: {
          id: requestInput.relatedProjectId,
        },
        select: {
          id: true,
          ownerUserId: true,
          visibility: true,
          members: {
            where: {
              userId: senderUserId,
            },
            select: {
              id: true,
            },
            take: 1,
          },
        },
      });

      if (!project || !this.canReferenceProject(project, senderUserId)) {
        throw new NotFoundException('Related project not found');
      }
    }

    if (requestInput.relatedThreadId) {
      const thread = await this.prisma.discussionThread.findUnique({
        where: {
          id: requestInput.relatedThreadId,
        },
        select: {
          id: true,
          projectId: true,
          createdByUserId: true,
          project: {
            select: {
              ownerUserId: true,
              members: {
                where: {
                  userId: senderUserId,
                },
                select: {
                  id: true,
                },
                take: 1,
              },
            },
          },
          participantStates: {
            where: {
              userId: senderUserId,
            },
            select: {
              id: true,
            },
            take: 1,
          },
        },
      });

      if (!thread || !this.canReferenceThread(thread, senderUserId)) {
        throw new NotFoundException('Related thread not found');
      }

      if (
        requestInput.relatedProjectId &&
        thread.projectId !== requestInput.relatedProjectId
      ) {
        throw new BadRequestException('Related thread does not belong to the project.');
      }
    }
  }

  private async ensureNoActiveDuplicateRequest(
    senderUserId: string,
    recipientUserId: string,
    requestInput: NormalizedCreateRequestInput,
  ) {
    const existingRequest = await this.prisma.request.findFirst({
      where: {
        fromUserId: senderUserId,
        toUserId: recipientUserId,
        type: requestInput.type,
        relatedProjectId: requestInput.relatedProjectId,
        relatedThreadId: requestInput.relatedThreadId,
        status: {
          in: [...ACTIVE_REQUEST_STATUSES],
        },
      },
      select: {
        id: true,
      },
    });

    if (existingRequest) {
      throw new ConflictException('An active request already exists for this recipient.');
    }
  }

  private async throwSentRequestUpdateFailure(
    requestId: string,
    senderUserId: string,
  ): Promise<never> {
    const request = await this.prisma.request.findFirst({
      where: {
        id: requestId,
        fromUserId: senderUserId,
      },
      select: {
        status: true,
      },
    });

    if (!request) {
      throw new NotFoundException('Request not found');
    }

    throw new BadRequestException('Only pending or replying requests can be cancelled.');
  }

  private async throwReceivedRequestUpdateFailure(
    requestId: string,
    recipientUserId: string,
  ): Promise<never> {
    const request = await this.prisma.request.findFirst({
      where: {
        id: requestId,
        toUserId: recipientUserId,
      },
      select: {
        status: true,
      },
    });

    if (!request) {
      throw new NotFoundException('Request not found');
    }

    throw new BadRequestException('Only pending or replying requests can be updated.');
  }

  private canReferenceProject(project: {
    ownerUserId: string;
    visibility: string;
    members: Array<{ id: string }>;
  }, senderUserId: string) {
    return (
      project.visibility === 'public' ||
      project.ownerUserId === senderUserId ||
      project.members.length > 0
    );
  }

  private canReferenceThread(
    thread: {
      createdByUserId: string;
      project: {
        ownerUserId: string;
        members: Array<{ id: string }>;
      };
      participantStates: Array<{ id: string }>;
    },
    senderUserId: string,
  ) {
    return (
      thread.createdByUserId === senderUserId ||
      thread.project.ownerUserId === senderUserId ||
      thread.project.members.length > 0 ||
      thread.participantStates.length > 0
    );
  }

  private isUniqueConstraintError(error: unknown) {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    );
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

  private toSentRequestItem(request: {
    id: string;
    type: string;
    title: string;
    status: string;
    unread: boolean;
    message: string | null;
    relatedProjectId: string | null;
    relatedThreadId: string | null;
    createdAt: Date;
    toUser: {
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
      to: request.toUser.name,
      toUser: request.toUser,
      role: request.toUser.title ?? 'Builder',
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

  private normalizeTitle(createRequestDto: CreateRequestDto) {
    const title = this.toNullableString(createRequestDto.title);

    if (title) {
      return title;
    }

    switch (createRequestDto.type) {
      case 'project':
        return 'Project collaboration request';
      case 'mentor':
        return 'Mentor review request';
      case 'internship':
        return 'Internship interest request';
      case 'message':
        return 'Conversation request';
      case 'resume':
        return 'Proof resume request';
      default:
        return 'Opportunity request';
    }
  }

  private toNullableString(value?: string | null) {
    const normalized = value?.trim();
    return normalized ? normalized : null;
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
