import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { TtlCache } from "src/common/utils/ttl-cache";
import { PrismaService } from "src/prisma/prisma.service";
import { UsersService } from "../users/users.service";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { UpdateProofProfileDto } from "./dto/update-proof-profile.dto";

const profileInclude = {
  proofProfile: {
    include: {
      links: {
        orderBy: { sortOrder: "asc" },
      },
      trustSignals: {
        orderBy: { sortOrder: "asc" },
      },
      skills: {
        orderBy: { sortOrder: "asc" },
      },
    },
  },
} satisfies Prisma.UserInclude;

const profileProjectInclude = {
  owner: {
    select: {
      id: true,
      name: true,
      username: true,
      avatar: true,
      title: true,
    },
  },
  techTags: {
    orderBy: {
      sortOrder: "asc" as const,
    },
  },
  openRoles: {
    orderBy: {
      sortOrder: "asc" as const,
    },
  },
  tags: {
    orderBy: {
      sortOrder: "asc" as const,
    },
  },
  _count: {
    select: {
      members: true,
    },
  },
} as const;

type ProfileProject = Prisma.ProjectGetPayload<{
  include: typeof profileProjectInclude;
}>;

@Injectable()
export class ProfilesService {
  private readonly profileCache = new TtlCache<
    Awaited<ReturnType<ProfilesService["buildProfileResponse"]>>
  >(30_000);

  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
  ) {}

  async getProfileByUsername(username: string, viewerUserId?: string) {
    const normalizedUsername = username.toLowerCase();
    const cached = viewerUserId
      ? null
      : this.profileCache.get(normalizedUsername);

    if (cached) {
      return cached;
    }

    const user = await this.prisma.user.findUnique({
      where: {
        username: normalizedUsername,
      },
      include: profileInclude,
    });

    if (!user) {
      throw new NotFoundException("Profile not found");
    }

    const [ownedProjects, completedIssues, posts, savedProjects] =
      await Promise.all([
        this.prisma.project.findMany({
          where: { ownerUserId: user.id },
          include: profileProjectInclude,
          orderBy: { createdAt: "desc" },
        }),
        this.prisma.issue.findMany({
          where: {
            status: "DONE",
            OR: [{ createdByUserId: user.id }, { assignedToUserId: user.id }],
          },
          include: {
            project: {
              select: {
                title: true,
              },
            },
          },
          orderBy: { updatedAt: "desc" },
          take: 10,
        }),
        this.prisma.post.findMany({
          where: { authorUserId: user.id },
          select: {
            id: true,
            title: true,
            type: true,
            createdAt: true,
            project: {
              select: {
                title: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        }),
        viewerUserId === user.id
          ? this.prisma.project.findMany({
              where: {
                saves: {
                  some: {
                    userId: user.id,
                  },
                },
              },
              include: profileProjectInclude,
              orderBy: {
                createdAt: "desc",
              },
            })
          : Promise.resolve([]),
      ]);

    const profileResponse = this.buildProfileResponse(
      user,
      ownedProjects,
      completedIssues,
      posts,
      savedProjects,
    );

    if (!viewerUserId) {
      this.profileCache.set(normalizedUsername, profileResponse);
    }

    return profileResponse;
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(updateProfileDto.name !== undefined
          ? { name: updateProfileDto.name.trim() }
          : {}),
        ...(updateProfileDto.title !== undefined
          ? { title: this.toNullableString(updateProfileDto.title) }
          : {}),
        ...(updateProfileDto.bio !== undefined
          ? { bio: this.toNullableString(updateProfileDto.bio) }
          : {}),
        ...(updateProfileDto.location !== undefined
          ? { location: this.toNullableString(updateProfileDto.location) }
          : {}),
        ...(updateProfileDto.openTo !== undefined
          ? { openTo: this.normalizeStringArray(updateProfileDto.openTo) }
          : {}),
      },
      select: {
        id: true,
        username: true,
      },
    });

    this.invalidateUserProfileCaches(user.id, user.username);
    return this.getProfileByUsername(user.username, user.id);
  }

  async updateProofProfile(
    userId: string,
    updateProofProfileDto: UpdateProofProfileDto,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
      },
    });

    if (!user) {
      throw new NotFoundException("Profile not found");
    }

    const links =
      updateProofProfileDto.links !== undefined
        ? this.normalizeProofLinks(updateProofProfileDto.links)
        : undefined;
    const skills =
      updateProofProfileDto.skills !== undefined
        ? this.normalizeProofSkills(updateProofProfileDto.skills)
        : undefined;
    const trustSignals =
      updateProofProfileDto.trustSignals !== undefined
        ? this.normalizeTrustSignals(updateProofProfileDto.trustSignals)
        : undefined;

    await this.prisma.$transaction(async (tx) => {
      const proofProfile = await tx.proofProfile.upsert({
        where: { userId },
        update: {
          ...(updateProofProfileDto.headline !== undefined
            ? {
                headline: this.toNullableString(updateProofProfileDto.headline),
              }
            : {}),
          ...(updateProofProfileDto.summary !== undefined
            ? { summary: this.toNullableString(updateProofProfileDto.summary) }
            : {}),
        },
        create: {
          userId,
          headline: this.toNullableString(updateProofProfileDto.headline),
          summary: this.toNullableString(updateProofProfileDto.summary),
        },
        select: { id: true },
      });

      if (links) {
        await tx.profileLink.deleteMany({
          where: { proofProfileId: proofProfile.id },
        });
        if (links.length > 0) {
          await tx.profileLink.createMany({
            data: links.map((link, index) => ({
              proofProfileId: proofProfile.id,
              label: link.label,
              value: link.value,
              iconKey: link.iconKey,
              sortOrder: index + 1,
            })),
          });
        }
      }

      if (skills) {
        await tx.profileSkill.deleteMany({
          where: { proofProfileId: proofProfile.id },
        });
        if (skills.length > 0) {
          await tx.profileSkill.createMany({
            data: skills.map((skill, index) => ({
              proofProfileId: proofProfile.id,
              name: skill.name,
              evidence: skill.evidence,
              level: skill.level,
              sortOrder: index + 1,
            })),
          });
        }
      }

      if (trustSignals) {
        await tx.profileTrustSignal.deleteMany({
          where: { proofProfileId: proofProfile.id },
        });
        if (trustSignals.length > 0) {
          await tx.profileTrustSignal.createMany({
            data: trustSignals.map((signal, index) => ({
              proofProfileId: proofProfile.id,
              label: signal.label,
              detail: signal.detail,
              iconKey: signal.iconKey,
              sortOrder: index + 1,
            })),
          });
        }
      }
    });

    this.invalidateUserProfileCaches(user.id, user.username);
    return this.getProfileByUsername(user.username, user.id);
  }

  private buildProfileResponse(
    user: Prisma.UserGetPayload<{ include: typeof profileInclude }>,
    ownedProjects: ProfileProject[],
    completedIssues: Array<{
      id: string;
      title: string;
      updatedAt: Date;
      project: { title: string };
    }>,
    posts: Array<{
      id: string;
      title: string;
      type: string;
      createdAt: Date;
      project: { title: string } | null;
    }>,
    savedProjects: ProfileProject[],
  ) {
    const storedProof = user.proofProfile;
    const skills = storedProof?.skills ?? [];
    const shippedProjectsCount = Math.max(
      storedProof?.shippedProjectsCount ?? 0,
      ownedProjects.length,
    );
    const completedTasksCount = Math.max(
      storedProof?.completedTasksCount ?? 0,
      completedIssues.length,
    );
    const verifiedSkillsCount = Math.max(
      storedProof?.verifiedSkillsCount ?? 0,
      skills.length,
    );

    return {
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        avatar: user.avatar,
        bio: user.bio,
        title: user.title,
        location: user.location,
        openTo: user.openTo,
      },
      proofProfile: {
        headline: storedProof?.headline ?? user.title,
        summary: storedProof?.summary ?? user.bio,
        proofScore:
          storedProof?.proofScore ??
          this.calculateProofScore(
            shippedProjectsCount,
            completedTasksCount,
            verifiedSkillsCount,
          ),
        builderLevel:
          storedProof?.builderLevel ??
          this.getBuilderLevel(shippedProjectsCount),
        rankLabel:
          storedProof?.rankLabel ?? this.getRankLabel(shippedProjectsCount),
        shippedProjectsCount,
        completedTasksCount,
        verifiedSkillsCount,
        mentorReviewsCount: storedProof?.mentorReviewsCount ?? 0,
        links:
          storedProof?.links.map((link) => ({
            label: link.label,
            value: link.value,
            iconKey: link.iconKey,
          })) ?? [],
        trustSignals:
          storedProof?.trustSignals.map((signal) => ({
            label: signal.label,
            detail: signal.detail,
            iconKey: signal.iconKey,
          })) ?? [],
        skills: skills.map((skill) => ({
          name: skill.name,
          evidence: skill.evidence,
          level: skill.level,
        })),
      },
      projects: ownedProjects.map((project) => this.toProfileProject(project)),
      savedProjects: savedProjects.map((project) =>
        this.toProfileProject(project),
      ),
      tasks: completedIssues.map(
        (issue) => `${issue.title} · ${issue.project.title}`,
      ),
      reviews: [],
      timeline: this.buildTimeline(ownedProjects, completedIssues, posts),
    };
  }

  private toProfileProject(project: ProfileProject) {
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
      likes: project.likesCount,
      comments: project.commentsCount,
      owner: project.owner,
      contributorsCount: project._count.members,
      techStack: project.techTags.map((tag) => tag.value),
      openRoles: project.openRoles.map((role) => role.value),
      tags: project.tags.map((tag) => tag.value),
    };
  }

  private buildTimeline(
    ownedProjects: ProfileProject[],
    completedIssues: Array<{
      id: string;
      title: string;
      updatedAt: Date;
      project: { title: string };
    }>,
    posts: Array<{
      id: string;
      title: string;
      type: string;
      createdAt: Date;
      project: { title: string } | null;
    }>,
  ) {
    return [
      ...ownedProjects.map((project) => ({
        date: this.formatTimelineDate(project.createdAt),
        timestamp: project.createdAt.getTime(),
        title: `Created ${project.title}`,
        detail:
          "Started a MeeTogether build room and opened it for proof tracking.",
      })),
      ...completedIssues.map((issue) => ({
        date: this.formatTimelineDate(issue.updatedAt),
        timestamp: issue.updatedAt.getTime(),
        title: `Completed ${issue.title}`,
        detail: `Marked work done in ${issue.project.title}.`,
      })),
      ...posts.map((post) => ({
        date: this.formatTimelineDate(post.createdAt),
        timestamp: post.createdAt.getTime(),
        title: post.title,
        detail: post.project
          ? `Published a ${post.type.toLowerCase().replace(/_/g, " ")} linked to ${post.project.title}.`
          : `Published a ${post.type.toLowerCase().replace(/_/g, " ")}.`,
      })),
    ]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 12)
      .map((item) => ({
        date: item.date,
        title: item.title,
        detail: item.detail,
      }));
  }

  private calculateProofScore(
    projectsCount: number,
    completedTasksCount: number,
    skillsCount: number,
  ) {
    return Math.min(
      999,
      projectsCount * 120 + completedTasksCount * 20 + skillsCount * 35,
    );
  }

  private getBuilderLevel(projectsCount: number) {
    if (projectsCount >= 5) {
      return "Level 5 Builder";
    }

    if (projectsCount >= 3) {
      return "Level 3 Builder";
    }

    if (projectsCount >= 1) {
      return "Level 2 Builder";
    }

    return "Level 1 Builder";
  }

  private getRankLabel(projectsCount: number) {
    if (projectsCount >= 5) {
      return "Proven shipper";
    }

    if (projectsCount >= 1) {
      return "Active builder";
    }

    return "New builder";
  }

  private formatTimelineDate(date: Date) {
    return date.toISOString().slice(0, 10);
  }

  private invalidateUserProfileCaches(userId: string, username: string) {
    this.profileCache.clear(username.toLowerCase());
    this.usersService.clearPublicUserCache(userId);
  }

  private toNullableString(value?: string) {
    const trimmed = value?.trim() ?? "";
    return trimmed.length > 0 ? trimmed : null;
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

  private normalizeProofLinks(
    links: NonNullable<UpdateProofProfileDto["links"]>,
  ) {
    const seen = new Set<string>();

    return links
      .map((link) => ({
        label: link.label.trim(),
        value: link.value.trim(),
        iconKey: this.toNullableString(link.iconKey),
      }))
      .filter((link) => link.label.length > 0 && link.value.length > 0)
      .filter((link) => {
        const key = `${link.label.toLowerCase()}::${link.value.toLowerCase()}`;
        if (seen.has(key)) {
          return false;
        }
        seen.add(key);
        return true;
      });
  }

  private normalizeProofSkills(
    skills: NonNullable<UpdateProofProfileDto["skills"]>,
  ) {
    const seen = new Set<string>();

    return skills
      .map((skill) => ({
        name: skill.name.trim(),
        evidence: this.toNullableString(skill.evidence),
        level: skill.level ?? null,
      }))
      .filter((skill) => skill.name.length > 0)
      .filter((skill) => {
        const key = skill.name.toLowerCase();
        if (seen.has(key)) {
          return false;
        }
        seen.add(key);
        return true;
      });
  }

  private normalizeTrustSignals(
    trustSignals: NonNullable<UpdateProofProfileDto["trustSignals"]>,
  ) {
    const seen = new Set<string>();

    return trustSignals
      .map((signal) => ({
        label: signal.label.trim(),
        detail: signal.detail.trim(),
        iconKey: this.toNullableString(signal.iconKey),
      }))
      .filter((signal) => signal.label.length > 0 && signal.detail.length > 0)
      .filter((signal) => {
        const key = signal.label.toLowerCase();
        if (seen.has(key)) {
          return false;
        }
        seen.add(key);
        return true;
      });
  }
}
