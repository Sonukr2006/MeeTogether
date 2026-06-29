import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Request, Response } from 'express';
import type { CookieOptions } from 'express';
import * as bcrypt from 'bcrypt';
import { randomBytes, createHash, timingSafeEqual } from 'crypto';
import { PrismaService } from 'src/prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { UsersService } from '../users/users.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { SignupDto } from './dto/signup.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';

const REFRESH_COOKIE_NAME = 'mt_refresh_token';
const CSRF_COOKIE_NAME = 'mt_csrf_token';
const CSRF_HEADER_NAME = 'x-csrf-token';

/**
 * Module-scoped variable storing the last generated one-time token for debug inspection.
 * Only populated when NODE_ENV !== 'production'.
 */
export let lastDebugToken: { type: string; token: string; expiresAt: Date } | null = null;
type RequestWithCookies = Request & {
  cookies?: Record<string, string | undefined>;
};

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
  ) {}

  async signup(signupDto: SignupDto, req: Request, res: Response) {
    const existingUser = await this.usersService.findByEmailOrUsername(
      signupDto.email,
      signupDto.username,
    );

    if (existingUser) {
      throw new ConflictException('Email or username already in use');
    }

    const passwordHash = await bcrypt.hash(signupDto.password, 12);
    const verification = this.generateOneTimeToken();
    const user = await this.prisma.user.create({
      data: {
        name: signupDto.name,
        username: signupDto.username.toLowerCase(),
        email: signupDto.email.toLowerCase(),
        passwordHash,
        openTo: [],
        emailVerificationTokenHash: this.hashToken(verification.token),
        emailVerificationExpiresAt: verification.expiresAt,
      },
    });

    const sessionResult = await this.issueSession(user.id, user.username, user.email, req, res);
    await this.sendVerificationEmail(user.email, verification.token);

    return sessionResult;
  }

  async login(loginDto: LoginDto, req: Request, res: Response) {
    const user = await this.usersService.findForAuth(loginDto.identifier);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatches = await bcrypt.compare(loginDto.password, user.passwordHash);

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.issueSession(user.id, user.username, user.email, req, res);
  }

  async getCurrentUser(userId: string) {
    return this.usersService.getPublicUserById(userId);
  }

  async refresh(req: RequestWithCookies, res: Response) {
    this.ensureTrustedOrigin(req);
    const refreshToken = this.getRefreshTokenFromRequest(req);

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token missing');
    }

    const refreshTokenHash = this.hashToken(refreshToken);
    const session = await this.prisma.session.findFirst({
      where: {
        refreshTokenHash,
        revokedAt: null,
      },
      include: {
        user: true,
      },
    });

    if (!session) {
      await this.handleRefreshTokenReuse(refreshTokenHash, req, res);
      throw new UnauthorizedException('Refresh token invalid or expired');
    }

    if (session.expiresAt < new Date()) {
      await this.prisma.session.update({
        where: { id: session.id },
        data: {
          revokedAt: session.revokedAt ?? new Date(),
        },
      });
      this.clearRefreshCookie(res);
      throw new UnauthorizedException('Refresh token invalid or expired');
    }

    this.validateCsrfForSession(req, session.csrfTokenHash);

    const updated = await this.prisma.session.updateMany({
      where: {
        id: session.id,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    if (updated.count !== 1) {
      this.clearRefreshCookie(res);
      throw new UnauthorizedException('Refresh token invalid or expired');
    }

    return this.issueSession(session.user.id, session.user.username, session.user.email, req, res, session.tokenFamilyId);
  }

  async logout(req: RequestWithCookies, res: Response) {
    this.ensureTrustedOrigin(req);
    const refreshToken = this.getRefreshTokenFromRequest(req);

    if (refreshToken) {
      const refreshTokenHash = this.hashToken(refreshToken);
      const session = await this.prisma.session.findFirst({
        where: {
          refreshTokenHash,
          revokedAt: null,
        },
        select: {
          csrfTokenHash: true,
        },
      });

      this.validateCsrfForSession(req, session?.csrfTokenHash);

      await this.prisma.session.updateMany({
        where: {
          refreshTokenHash,
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
        },
      });
    }

    this.clearRefreshCookie(res);
    return { success: true };
  }

  async logoutAll(userId: string, req: Request, res: Response) {
    this.ensureTrustedOrigin(req);
    const refreshToken = this.getRefreshTokenFromRequest(req as RequestWithCookies);

    if (refreshToken) {
      const session = await this.prisma.session.findFirst({
        where: {
          refreshTokenHash: this.hashToken(refreshToken),
          revokedAt: null,
          userId,
        },
        select: {
          csrfTokenHash: true,
        },
      });

      this.validateCsrfForSession(req as RequestWithCookies, session?.csrfTokenHash);
    }

    await this.prisma.session.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    this.clearRefreshCookie(res);
    return { success: true };
  }

  async verifyEmail(verifyEmailDto: VerifyEmailDto) {
    const user = await this.prisma.user.findFirst({
      where: {
        emailVerificationTokenHash: this.hashToken(verifyEmailDto.token),
      },
    });

    if (!user || !user.emailVerificationExpiresAt || user.emailVerificationExpiresAt < new Date()) {
      throw new UnauthorizedException('Verification token invalid or expired');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        accountState: 'ACTIVE',
        emailVerificationTokenHash: null,
        emailVerificationExpiresAt: null,
      },
    });

    return { success: true };
  }

  async resendVerification(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.emailVerified) {
      return { success: true, message: 'Email is already verified' };
    }

    const verification = this.generateOneTimeToken();
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        emailVerificationTokenHash: this.hashToken(verification.token),
        emailVerificationExpiresAt: verification.expiresAt,
      },
    });

    await this.sendVerificationEmail(user.email, verification.token);

    return {
      success: true,
      message: 'Verification email resent',
    };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const user = await this.prisma.user.findFirst({
      where: {
        email: forgotPasswordDto.email.toLowerCase(),
      },
    });

    if (!user) {
      return {
        success: true,
        message: 'If the account exists, a password reset link has been prepared',
      };
    }

    const reset = this.generateOneTimeToken(
      (this.configService.get<number>('passwordResetTtlMinutes') ?? 30) * 60 * 1000,
      'reset',
    );

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetTokenHash: this.hashToken(reset.token),
        passwordResetExpiresAt: reset.expiresAt,
      },
    });

    await this.sendPasswordResetEmail(user.email, reset.token);

    return {
      success: true,
      message: 'If the account exists, a password reset link has been prepared',
    };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const user = await this.prisma.user.findFirst({
      where: {
        passwordResetTokenHash: this.hashToken(resetPasswordDto.token),
      },
    });

    if (!user || !user.passwordResetExpiresAt || user.passwordResetExpiresAt < new Date()) {
      throw new UnauthorizedException('Password reset token invalid or expired');
    }

    const passwordHash = await bcrypt.hash(resetPasswordDto.newPassword, 12);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash,
          passwordResetTokenHash: null,
          passwordResetExpiresAt: null,
        },
      }),
      this.prisma.session.updateMany({
        where: {
          userId: user.id,
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
        },
      }),
    ]);

    return { success: true };
  }

  private async issueSession(
    userId: string,
    username: string,
    email: string,
    req: Request,
    res: Response,
    existingTokenFamilyId?: string,
  ) {
    const refreshToken = randomBytes(48).toString('hex');
    const refreshTokenHash = this.hashToken(refreshToken);
    const csrfToken = randomBytes(32).toString('hex');
    const csrfTokenHash = this.hashToken(csrfToken);
    const refreshTokenTtlDays = this.configService.get<number>('refreshTokenTtlDays') ?? 30;
    const expiresAt = new Date(Date.now() + refreshTokenTtlDays * 24 * 60 * 60 * 1000);

    const session = await this.prisma.session.create({
      data: {
        userId,
        refreshTokenHash,
        csrfTokenHash,
        tokenFamilyId: existingTokenFamilyId ?? randomBytes(16).toString('hex'),
        userAgent: req.get('user-agent'),
        ipAddress: req.ip,
        expiresAt,
        lastUsedAt: new Date(),
      },
    });

    const user = await this.usersService.getPublicUserById(userId);

    const accessToken = await this.jwtService.signAsync({
      sub: userId,
      sid: session.id,
      username,
      email,
      emailVerified: user.emailVerified ?? false,
    });

    res.cookie(REFRESH_COOKIE_NAME, refreshToken, this.getRefreshCookieOptions(expiresAt));
    res.cookie(CSRF_COOKIE_NAME, csrfToken, this.getCsrfCookieOptions(expiresAt));

    return {
      accessToken,
      user,
    };
  }

  private clearRefreshCookie(res: Response) {
    res.clearCookie(REFRESH_COOKIE_NAME, this.getRefreshCookieOptions());
    res.clearCookie(CSRF_COOKIE_NAME, this.getCsrfCookieOptions());
  }

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private getRefreshTokenFromRequest(req: RequestWithCookies): string | undefined {
    const cookies = req.cookies as Record<string, unknown> | undefined;
    const cookieValue = cookies?.[REFRESH_COOKIE_NAME];
    return typeof cookieValue === 'string' ? cookieValue : undefined;
  }

  private getCsrfTokenFromRequest(req: RequestWithCookies): string | undefined {
    const cookies = req.cookies as Record<string, unknown> | undefined;
    const cookieValue = cookies?.[CSRF_COOKIE_NAME];
    return typeof cookieValue === 'string' ? cookieValue : undefined;
  }

  private async handleRefreshTokenReuse(
    refreshTokenHash: string,
    req: Request,
    res: Response,
  ) {
    const reusedSession = await this.prisma.session.findFirst({
      where: {
        refreshTokenHash,
      },
    });

    if (!reusedSession) {
      this.clearRefreshCookie(res);
      return;
    }

    this.logger.warn(
      `Detected refresh token reuse for session family ${reusedSession.tokenFamilyId} from ${req.ip ?? 'unknown-ip'}`,
    );

    await this.prisma.session.updateMany({
      where: {
        tokenFamilyId: reusedSession.tokenFamilyId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    this.clearRefreshCookie(res);
  }

  private getRefreshCookieOptions(expiresAt?: Date): CookieOptions {
    const isProduction = this.configService.get<string>('nodeEnv') === 'production';
    const sameSiteSetting =
      (this.configService.get<'lax' | 'strict' | 'none'>('auth.cookieSameSite') ?? 'lax');
    const cookieDomain = this.configService.get<string | undefined>('auth.cookieDomain');

    return {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? sameSiteSetting : 'lax',
      path: '/api/v1/auth',
      ...(cookieDomain ? { domain: cookieDomain } : {}),
      ...(expiresAt ? { expires: expiresAt } : {}),
    };
  }

  private getCsrfCookieOptions(expiresAt?: Date): CookieOptions {
    const isProduction = this.configService.get<string>('nodeEnv') === 'production';
    const sameSiteSetting =
      (this.configService.get<'lax' | 'strict' | 'none'>('auth.cookieSameSite') ?? 'lax');
    const cookieDomain = this.configService.get<string | undefined>('auth.cookieDomain');

    return {
      httpOnly: false,
      secure: isProduction,
      sameSite: isProduction ? sameSiteSetting : 'lax',
      path: '/',
      ...(cookieDomain ? { domain: cookieDomain } : {}),
      ...(expiresAt ? { expires: expiresAt } : {}),
    };
  }

  private validateCsrfForSession(
    req: RequestWithCookies,
    sessionCsrfTokenHash?: string | null,
  ) {
    if (!sessionCsrfTokenHash) {
      throw new UnauthorizedException('Session expired — please log in again');
    }

    const headerToken = req.get(CSRF_HEADER_NAME);
    const cookieToken = this.getCsrfTokenFromRequest(req);

    if (!headerToken || !cookieToken) {
      throw new UnauthorizedException('CSRF token missing or invalid');
    }

    const headerBuffer = Buffer.from(headerToken, 'utf8');
    const cookieBuffer = Buffer.from(cookieToken, 'utf8');
    if (
      headerBuffer.length !== cookieBuffer.length ||
      !timingSafeEqual(headerBuffer, cookieBuffer)
    ) {
      throw new UnauthorizedException('CSRF token missing or invalid');
    }

    if (this.hashToken(headerToken) !== sessionCsrfTokenHash) {
      throw new UnauthorizedException('CSRF token missing or invalid');
    }
  }

  private ensureTrustedOrigin(req: Request) {
    const origin = req.get('origin');

    if (!origin) {
      return;
    }

    const trustedOrigins = this.configService.get<string[]>('clientOrigins') ?? [];

    if (!trustedOrigins.includes(origin)) {
      throw new UnauthorizedException('Untrusted request origin');
    }
  }

  private generateOneTimeToken(ttlMs?: number, type: string = 'verification') {
    const token = randomBytes(32).toString('hex');
    const defaultTtlHours = this.configService.get<number>('emailVerificationTtlHours') ?? 24;
    const expiresAt = new Date(Date.now() + (ttlMs ?? defaultTtlHours * 60 * 60 * 1000));

    if (process.env.NODE_ENV !== 'production') {
      lastDebugToken = { type, token, expiresAt };
    }

    return { token, expiresAt };
  }



  private async sendVerificationEmail(email: string, token: string) {
    const appBaseUrl = this.configService.get<string>('appBaseUrl') ?? 'http://localhost:5173';
    const verifyUrl = `${appBaseUrl}/verify-email?token=${encodeURIComponent(token)}`;

    await this.emailService.sendEmail({
      to: email,
      subject: 'Verify your MeeTogether email',
      text: `Verify your email by opening: ${verifyUrl}`,
      html: `<p>Verify your email by opening <a href="${verifyUrl}">${verifyUrl}</a></p>`,
    });
  }

  private async sendPasswordResetEmail(email: string, token: string) {
    const appBaseUrl = this.configService.get<string>('appBaseUrl') ?? 'http://localhost:5173';
    const resetUrl = `${appBaseUrl}/reset-password?token=${encodeURIComponent(token)}`;

    await this.emailService.sendEmail({
      to: email,
      subject: 'Reset your MeeTogether password',
      text: `Reset your password by opening: ${resetUrl}`,
      html: `<p>Reset your password by opening <a href="${resetUrl}">${resetUrl}</a></p>`,
    });
  }
}
