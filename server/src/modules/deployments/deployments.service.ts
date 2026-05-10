import { Injectable } from '@nestjs/common';
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

  async getDeployments() {
    const prisma = this.prisma as PrismaService & {
      deployment: {
        findMany(args: {
          include: typeof deploymentInclude;
          orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }];
        }): Promise<DeploymentRow[]>;
      };
    };

    const deployments = await prisma.deployment.findMany({
      include: deploymentInclude,
      orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
    });

    return deployments.map((deployment) => ({
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
