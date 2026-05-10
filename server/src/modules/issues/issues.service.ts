import { Injectable } from '@nestjs/common';
import { IssuePriority, IssueStatus, Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

const issueInclude = {
  project: {
    include: {
      techTags: {
        orderBy: {
          sortOrder: 'asc' as const,
        },
      },
      openRoles: {
        orderBy: {
          sortOrder: 'asc' as const,
        },
      },
    },
  },
  assignedTo: {
    select: {
      id: true,
      name: true,
    },
  },
  createdBy: {
    select: {
      id: true,
      name: true,
    },
  },
} as const;

type IssueWithRelations = Prisma.IssueGetPayload<{
  include: typeof issueInclude;
}>;

@Injectable()
export class IssuesService {
  constructor(private readonly prisma: PrismaService) {}

  async getIssues(filters: { projectId?: string; status?: string }) {
    const issues = await this.prisma.issue.findMany({
      where: {
        projectId: filters.projectId || undefined,
        status: this.toIssueStatus(filters.status),
      },
      include: issueInclude,
      orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
    });

    return issues.map((issue: IssueWithRelations) => ({
      id: issue.id,
      title: issue.title,
      description: issue.description,
      owner: issue.assignedTo?.name ?? issue.createdBy.name,
      status: this.toUiStatus(issue.status),
      projectId: issue.projectId,
      projectTitle: issue.project.title,
      difficulty: issue.project.difficulty ?? 'Active room',
      mentorStatus: issue.project.mentorStatus ?? 'Mentor status not set',
      stack: issue.project.techTags.map((tag) => tag.value),
      roleNeed: issue.roleNeed ?? issue.project.openRoles[0]?.value ?? 'Builder',
      priority: this.toUiPriority(issue.priority),
      createdAt: issue.createdAt,
      updatedAt: issue.updatedAt,
    }));
  }

  private toIssueStatus(status?: string): IssueStatus | undefined {
    switch (status?.trim().toLowerCase()) {
      case 'open':
        return IssueStatus.OPEN;
      case 'in progress':
      case 'in_progress':
      case 'in-progress':
        return IssueStatus.IN_PROGRESS;
      case 'done':
        return IssueStatus.DONE;
      default:
        return undefined;
    }
  }

  private toUiStatus(status: IssueStatus) {
    switch (status) {
      case IssueStatus.OPEN:
        return 'Open';
      case IssueStatus.IN_PROGRESS:
        return 'In progress';
      case IssueStatus.DONE:
        return 'Done';
    }
  }

  private toUiPriority(priority: IssuePriority) {
    switch (priority) {
      case 'HIGH':
        return 'High';
      case 'MEDIUM':
        return 'Medium';
      default:
        return 'Normal';
    }
  }
}
