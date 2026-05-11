import { Injectable, NotFoundException } from '@nestjs/common';
import { TtlCache } from 'src/common/utils/ttl-cache';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UsersService {
  private readonly publicUserCache = new TtlCache<Awaited<ReturnType<UsersService['fetchPublicUserById']>>>(30_000);

  constructor(private readonly prisma: PrismaService) {}

  async findByEmailOrUsername(email: string, username: string) {
    return this.prisma.user.findFirst({
      where: {
        OR: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }],
      },
    });
  }

  async findForAuth(identifier: string) {
    return this.prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier.toLowerCase() },
          { username: identifier.toLowerCase() },
        ],
      },
    });
  }

  async getPublicUserById(userId: string) {
    const cached = this.publicUserCache.get(userId);
    if (cached) {
      return cached;
    }

    const user = await this.fetchPublicUserById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    this.publicUserCache.set(userId, user);
    return user;
  }

  async updateAvatar(userId: string, avatarUrl: string) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        avatar: avatarUrl.trim(),
      },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        avatar: true,
        bio: true,
        title: true,
        location: true,
        openTo: true,
        emailVerified: true,
        accountState: true,
        createdAt: true,
      },
    });

    this.publicUserCache.clear(userId);
    this.publicUserCache.set(userId, user);
    return user;
  }

  private fetchPublicUserById(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        avatar: true,
        bio: true,
        title: true,
        location: true,
        openTo: true,
        emailVerified: true,
        accountState: true,
        createdAt: true,
      },
    });
  }
}
