import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class PermissionService {
  constructor(private readonly prisma: PrismaService) {}

  async canViewProject(userId: string | null, projectId: string): Promise<boolean> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: {
        visibility: true,
        ownerUserId: true,
        members: userId ? {
          where: { userId },
          select: { id: true },
          take: 1,
        } : undefined,
      },
    });
    if (!project) return false;
    if (project.visibility === 'public') return true;
    if (!userId) return false;
    if (project.ownerUserId === userId) return true;
    if (project.members && project.members.length > 0) return true;
    return false;
  }

  async canEditProject(userId: string, projectId: string): Promise<boolean> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { ownerUserId: true },
    });
    if (!project) return false;
    return project.ownerUserId === userId;
  }

  async canManageIssue(userId: string, projectId: string): Promise<boolean> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: {
        ownerUserId: true,
        members: {
          where: { userId },
          select: { id: true },
          take: 1,
        },
      },
    });
    if (!project) return false;
    if (project.ownerUserId === userId) return true;
    if (project.members.length > 0) return true;
    return false;
  }

  async canManageDeployment(userId: string, projectId: string): Promise<boolean> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { ownerUserId: true },
    });
    if (!project) return false;
    return project.ownerUserId === userId;
  }

  async canViewComments(userId: string | null, entityType: 'post' | 'project', entityId: string): Promise<boolean> {
    if (entityType === 'post') {
      // Post comments follow feed visibility — public by default
      return true;
    }
    if (entityType === 'project') {
      const project = await this.prisma.project.findUnique({
        where: { id: entityId },
        select: { visibility: true },
      });
      if (!project) return false;
      return project.visibility === 'public' || userId !== null;
    }
    return false;
  }
}
