import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthenticatedUser } from '../types/authenticated-user.type';

type RequestWithUser = {
  user?: AuthenticatedUser;
};

@Injectable()
export class VerifiedAccountGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const userId = request.user?.sub;

    if (!userId) {
      throw new ForbiddenException('Email verification required');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        emailVerified: true,
      },
    });

    if (!user?.emailVerified) {
      throw new ForbiddenException('Verify your email to continue');
    }

    return true;
  }
}
