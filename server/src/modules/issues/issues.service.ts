import { Injectable } from '@nestjs/common';
import { IssuePriority, IssueStatus, Prisma } from '@prisma/client';
import { PaginatedResponse } from 'src/common/interfaces/paginated-response.interface';
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

  async getIssues(filters: { projectId?: string; status?: string; cursor?: string; limit?: number }): Promise<PaginatedResponse<{
    id: string;
    title: string;
    description: string | null;
    owner: string;
    status: string;
    projectId: string;
    projectTitle: string;
    difficulty: string;
    mentorStatus: string;
    stack: string[];
    roleNeed: string;
    priority: string;
    createdAt: Date;
    updatedAt: Date;
  }>> {
    const limit = Math.min(filters.limit ?? 20, 50);
    const cursor = filters.cursor;

    const issues = await this.prisma.issue.findMany({
      where: {
        projectId: filters.projectId || undefined,
        status: this.toIssueStatus(filters.status),
      },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: issueInclude,
      orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
    });

    const hasMore = issues.length > limit;
    const data = hasMore ? issues.slice(0, limit) : issues;

    const mapped = data.map((issue: IssueWithRelations) => ({
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

    const nextCursor = hasMore ? mapped[mapped.length - 1].id : null;

    return {
      data: mapped,
      pagination: {
        nextCursor,
        hasMore,
      },
    };
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
