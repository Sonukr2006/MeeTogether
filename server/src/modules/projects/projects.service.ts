import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { TtlCache } from 'src/common/utils/ttl-cache';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';

const projectInclude = {
  owner: {
    select: {
      id: true,
      name: true,
      username: true,
      avatar: true,
      title: true,
    },
  },
  members: {
    include: {
      user: {
        select: {
          id: true,
          name: true,
          username: true,
          avatar: true,
        },
      },
    },
    orderBy: {
      joinedAt: 'asc' as const,
    },
  },
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
  tags: {
    orderBy: {
      sortOrder: 'asc' as const,
    },
  },
} as const;

type ProjectWithRelations = Prisma.ProjectGetPayload<{
  include: typeof projectInclude;
}>;

@Injectable()
export class ProjectsService {
  private readonly projectsListCache = new TtlCache<ReturnType<ProjectsService['toProjectSummary']>[]>(30_000);
  private readonly projectDetailCache = new TtlCache<ReturnType<ProjectsService['toProjectDetail']>>(30_000);

  constructor(private readonly prisma: PrismaService) {}

  async getProjects() {
    const cached = this.projectsListCache.get('all');
    if (cached) {
      return cached;
    }

    const projects = await this.prisma.project.findMany({
      include: {
        owner: projectInclude.owner,
        techTags: projectInclude.techTags,
        openRoles: projectInclude.openRoles,
        tags: projectInclude.tags,
        _count: {
          select: {
            members: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const summaries = projects.map((project) =>
      this.toProjectSummary(project as ProjectWithRelations & { _count: { members: number } }),
    );

    this.projectsListCache.set('all', summaries);
    return summaries;
  }

  async createProject(userId: string, createProjectDto: CreateProjectDto) {
    const techStack = this.normalizeStringArray(createProjectDto.techStack);
    const openRoles = this.normalizeStringArray(createProjectDto.openRoles);

    const created = await this.prisma.$transaction(async (tx) => {
      const project = await tx.project.create({
        data: {
          ownerUserId: userId,
          title: createProjectDto.title.trim(),
          problem: createProjectDto.problemStatement.trim(),
          solution: createProjectDto.solutionApproach.trim(),
          image: createProjectDto.imageUrl?.trim() || null,
          progress: 0,
          visibility: createProjectDto.visibility ?? 'public',
          difficulty: createProjectDto.difficulty?.trim() || null,
          timeline: createProjectDto.timeline?.trim() || null,
          mentorStatus: createProjectDto.mentorStatus?.trim() || null,
          githubUrl: createProjectDto.githubUrl?.trim() || null,
          demoUrl: createProjectDto.demoUrl?.trim() || null,
        },
      });

      await tx.projectMember.create({
        data: {
          projectId: project.id,
          userId,
          roleLabel: 'Owner',
        },
      });

      if (techStack.length > 0) {
        await tx.projectTechTag.createMany({
          data: techStack.map((value, index) => ({
            projectId: project.id,
            value,
            sortOrder: index + 1,
          })),
        });
      }

      if (openRoles.length > 0) {
        await tx.projectOpenRole.createMany({
          data: openRoles.map((value, index) => ({
            projectId: project.id,
            value,
            sortOrder: index + 1,
          })),
        });
      }

      const defaultThread = await tx.discussionThread.create({
        data: {
          projectId: project.id,
          title: `${project.title} discussion`,
          kind: 'default',
          createdByUserId: userId,
        },
      });

      await tx.threadParticipantState.create({
        data: {
          threadId: defaultThread.id,
          userId,
        },
      });

      const createdProject = await tx.project.findUniqueOrThrow({
        where: { id: project.id },
        include: {
          owner: projectInclude.owner,
          techTags: projectInclude.techTags,
          openRoles: projectInclude.openRoles,
          tags: projectInclude.tags,
          _count: {
            select: {
              members: true,
            },
          },
        },
      });

      return {
        id: project.id,
        title: project.title,
        defaultThreadId: defaultThread.id,
        project: this.toProjectSummary(
          createdProject as ProjectWithRelations & { _count: { members: number } },
        ),
      };
    });

    this.projectsListCache.clear();
    this.projectDetailCache.clear(created.id);

    return created;
  }

  async getProjectById(projectId: string) {
    const cached = this.projectDetailCache.get(projectId);
    if (cached) {
      return cached;
    }

    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: projectInclude,
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const detail = this.toProjectDetail(project);
    this.projectDetailCache.set(projectId, detail);
    return detail;
  }

  private toProjectSummary(project: ProjectWithRelations & { _count?: { members: number } }) {
    return {
      id: project.id,
      createdAt: project.createdAt,
      title: project.title,
      problem: project.problem,
      solution: project.solution,
      image: project.image,
      progress: project.progress,
      difficulty: project.difficulty,
      timeline: project.timeline,
      mentorStatus: project.mentorStatus,
      githubUrl: project.githubUrl,
      demoUrl: project.demoUrl,
      owner: project.owner,
      contributorsCount: project._count?.members ?? project.members.length,
      techStack: project.techTags.map((tag: ProjectWithRelations['techTags'][number]) => tag.value),
      openRoles: project.openRoles.map((role: ProjectWithRelations['openRoles'][number]) => role.value),
      tags: project.tags.map((tag: ProjectWithRelations['tags'][number]) => tag.value),
    };
  }

  private toProjectDetail(project: ProjectWithRelations) {
    return {
      id: project.id,
      title: project.title,
      problem: project.problem,
      solution: project.solution,
      image: project.image,
      progress: project.progress,
      visibility: project.visibility,
      difficulty: project.difficulty,
      timeline: project.timeline,
      mentorStatus: project.mentorStatus,
      githubUrl: project.githubUrl,
      demoUrl: project.demoUrl,
      owner: project.owner,
      members: project.members.map((member: ProjectWithRelations['members'][number]) => ({
        id: member.user.id,
        name: member.user.name,
        username: member.user.username,
        avatar: member.user.avatar,
        roleLabel: member.roleLabel,
        joinedAt: member.joinedAt,
      })),
      techStack: project.techTags.map((tag: ProjectWithRelations['techTags'][number]) => tag.value),
      openRoles: project.openRoles.map((role: ProjectWithRelations['openRoles'][number]) => role.value),
      tags: project.tags.map((tag: ProjectWithRelations['tags'][number]) => tag.value),
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    };
  }

  private normalizeStringArray(values?: string[]) {
    const seen = new Set<string>();

    return (values ?? [])
      .map((value) => value.trim())
      .filter((value) => value.length > 0)
      .filter((value) => {
        const normalized = value.toLowerCase();
        if (seen.has(normalized)) {
          return false;
        }
        seen.add(normalized);
        return true;
      });
  }
}
