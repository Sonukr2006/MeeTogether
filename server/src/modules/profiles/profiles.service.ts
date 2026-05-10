import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { TtlCache } from 'src/common/utils/ttl-cache';
import { PrismaService } from 'src/prisma/prisma.service';

const profileInclude = {
  proofProfile: {
    include: {
      links: {
        orderBy: { sortOrder: 'asc' },
      },
      trustSignals: {
        orderBy: { sortOrder: 'asc' },
      },
      skills: {
        orderBy: { sortOrder: 'asc' },
      },
    },
  },
} satisfies Prisma.UserInclude;

@Injectable()
export class ProfilesService {
  private readonly profileCache = new TtlCache<Awaited<ReturnType<ProfilesService['buildProfileResponse']>>>(30_000);

  constructor(private readonly prisma: PrismaService) {}

  async getProfileByUsername(username: string) {
    const normalizedUsername = username.toLowerCase();
    const cached = this.profileCache.get(normalizedUsername);

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
      throw new NotFoundException('Profile not found');
    }

    const profileResponse = this.buildProfileResponse(user);
    this.profileCache.set(normalizedUsername, profileResponse);
    return profileResponse;
  }

  private buildProfileResponse(user: Prisma.UserGetPayload<{ include: typeof profileInclude }>) {
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
      proofProfile: user.proofProfile
        ? {
            headline: user.proofProfile.headline,
            summary: user.proofProfile.summary,
            proofScore: user.proofProfile.proofScore,
            builderLevel: user.proofProfile.builderLevel,
            rankLabel: user.proofProfile.rankLabel,
            shippedProjectsCount: user.proofProfile.shippedProjectsCount,
            completedTasksCount: user.proofProfile.completedTasksCount,
            verifiedSkillsCount: user.proofProfile.verifiedSkillsCount,
            mentorReviewsCount: user.proofProfile.mentorReviewsCount,
            links: user.proofProfile.links.map((link) => ({
              label: link.label,
              value: link.value,
              iconKey: link.iconKey,
            })),
            trustSignals: user.proofProfile.trustSignals.map((signal) => ({
              label: signal.label,
              detail: signal.detail,
              iconKey: signal.iconKey,
            })),
            skills: user.proofProfile.skills.map((skill) => ({
              name: skill.name,
              evidence: skill.evidence,
              level: skill.level,
            })),
          }
        : null,
    };
  }
}
