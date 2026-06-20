import { Injectable } from '@nestjs/common';
import { CursorPaginationDto } from 'src/common/dto/cursor-pagination.dto';
import { PaginatedResponse } from 'src/common/interfaces/paginated-response.interface';
import { PrismaService } from 'src/prisma/prisma.service';

const deploymentInclude = {
  project: {
    include: {
      techTags: {
        orderBy: {
          sortOrder: 'asc' as const,
        },
      },
    },
  },
} as const;

type DeploymentStatus = 'LIVE' | 'PREVIEW' | 'QUEUED';
type DeploymentStatusLabel = 'Live' | 'Preview' | 'Queued';
type DeploymentRow = {
  id: string;
  projectId: string;
  status: DeploymentStatus;
  note: string | null;
  updatedAt: Date;
  environment: string;
  liveUrl: string | null;
  repoUrl: string | null;
  progress: number;
  buildHealth: string | null;
  currentFocus: string | null;
  project: {
    title: string;
    mentorStatus: string | null;
    techTags: Array<{
      value: string;
    }>;
  };
};

@Injectable()
export class DeploymentsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDeployments(query?: CursorPaginationDto): Promise<PaginatedResponse<{
    id: string;
    projectId: string;
    title: string;
    status: { label: DeploymentStatusLabel; note: string };
    updatedAt: string;
    environment: string;
    liveUrl: string | null;
    repoUrl: string | null;
    progress: number;
    buildHealth: string;
    milestone: string;
    stack: string[];
    mentorStatus: string;
  }>> {
    const limit = Math.min(query?.limit ?? 20, 50);
    const cursor = query?.cursor;

    const prisma = this.prisma as PrismaService & {
      deployment: {
        findMany(args: {
          take: number;
          skip?: number;
          cursor?: { id: string };
          include: typeof deploymentInclude;
          orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }];
        }): Promise<DeploymentRow[]>;
      };
    };

    const deployments = await prisma.deployment.findMany({
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: deploymentInclude,
      orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
    });

    const hasMore = deployments.length > limit;
    const data = hasMore ? deployments.slice(0, limit) : deployments;

    const mapped = data.map((deployment) => ({
      id: deployment.id,
      projectId: deployment.projectId,
      title: deployment.project.title,
      status: {
        label: this.toUiStatus(deployment.status),
        note: deployment.note ?? this.getStatusNote(deployment.status),
      },
      updatedAt: this.getRelativeTime(deployment.updatedAt),
      environment: deployment.environment,
      liveUrl: deployment.liveUrl,
      repoUrl: deployment.repoUrl,
      progress: deployment.progress,
      buildHealth: deployment.buildHealth ?? 'Build health not available',
      milestone: deployment.currentFocus ?? 'Deployment setup',
      stack: deployment.project.techTags.map((tag) => tag.value),
      mentorStatus: deployment.project.mentorStatus ?? 'Mentor status not set',
    }));

    const nextCursor = hasMore ? mapped[mapped.length - 1].id : null;

    return {
      data: mapped,
      pagination: {
        nextCursor,
        hasMore,
      },
    };
  }

  private toUiStatus(status: DeploymentStatus): DeploymentStatusLabel {
    switch (status) {
      case 'LIVE':
        return 'Live';
      case 'PREVIEW':
        return 'Preview';
      case 'QUEUED':
        return 'Queued';
      default:
        return this.assertUnreachable(status);
    }
  }

  private getStatusNote(status: DeploymentStatus): string {
    switch (status) {
      case 'LIVE':
        return 'Stable build with active proof signals';
      case 'PREVIEW':
        return 'Internal preview ready for collaborator review';
      case 'QUEUED':
        return 'Deployment blocked by open implementation work';
      default:
        return this.assertUnreachable(status);
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

  private assertUnreachable(value: never): never {
    throw new Error(`Unhandled deployment status: ${String(value)}`);
  }
}
