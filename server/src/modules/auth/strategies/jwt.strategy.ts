import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { TtlCache } from 'src/common/utils/ttl-cache';
import { AuthenticatedUser } from '../types/authenticated-user.type';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private sessionCache = new TtlCache<boolean>(30_000);
  private userCache = new TtlCache<boolean>(30_000);

  constructor(
    configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('jwt.accessSecret'),
    });
  }

  async validate(payload: AuthenticatedUser) {
    if (!payload.sub || !payload.sid) {
      throw new UnauthorizedException('Invalid token');
    }

    // Check user suspension cache
    const cachedUser = this.userCache.get(payload.sub);
    if (cachedUser === null) {
      // Cache miss — query DB for suspension check
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: {
          id: true,
          accountState: true,
        },
      });

      if (!user || user.accountState === 'SUSPENDED') {
        throw new UnauthorizedException('Invalid token');
      }

      this.userCache.set(payload.sub, true);
    }

    // Check session existence cache
    const cachedSession = this.sessionCache.get(payload.sid);
    if (cachedSession === null) {
      // Cache miss — query DB for session validity
      const session = await this.prisma.session.findUnique({
        where: { id: payload.sid },
        select: {
          revokedAt: true,
          expiresAt: true,
        },
      });

      if (!session || session.revokedAt || session.expiresAt < new Date()) {
        throw new UnauthorizedException('Invalid token');
      }

      this.sessionCache.set(payload.sid, true);
    }

    return {
      sub: payload.sub,
      sid: payload.sid,
      username: payload.username,
      email: payload.email,
      emailVerified: payload.emailVerified ?? false,
    };
  }

  /**
   * Invalidates the cached session entry so that subsequent requests
   * using a revoked session are rejected immediately rather than
   * waiting for the 30s TTL to expire.
   */
  invalidateSessionCache(sessionId: string): void {
    this.sessionCache.clear(sessionId);
  }

  /**
   * Invalidates the cached user entry so that subsequent requests
   * from a suspended user are rejected immediately.
   */
  invalidateUserCache(userId: string): void {
    this.userCache.clear(userId);
  }
}
