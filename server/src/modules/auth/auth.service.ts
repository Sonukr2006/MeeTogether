import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Request, Response } from 'express';
import * as bcrypt from 'bcrypt';
import { randomBytes, createHash } from 'crypto';
import { PrismaService } from 'src/prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { UsersService } from '../users/users.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { SignupDto } from './dto/signup.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';

const REFRESH_COOKIE_NAME = 'mt_refresh_token';
type RequestWithCookies = Request & {
  cookies?: Record<string, string | undefined>;
};

@Injectable()
export class AuthService {
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

    return {
      ...sessionResult,
      verification: this.buildTokenPreview('email_verification', verification.token, verification.expiresAt),
    };
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

    if (!session || session.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token invalid or expired');
    }

    await this.prisma.session.update({
      where: { id: session.id },
      data: {
        revokedAt: new Date(),
      },
    });

    return this.issueSession(session.user.id, session.user.username, session.user.email, req, res, session.tokenFamilyId);
  }

  async logout(req: RequestWithCookies, res: Response) {
    this.ensureTrustedOrigin(req);
    const refreshToken = this.getRefreshTokenFromRequest(req);

    if (refreshToken) {
      await this.prisma.session.updateMany({
        where: {
          refreshTokenHash: this.hashToken(refreshToken),
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
      message: 'Verification token refreshed',
      verification: this.buildTokenPreview('email_verification', verification.token, verification.expiresAt),
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
      reset: this.buildTokenPreview('password_reset', reset.token, reset.expiresAt),
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
    const accessToken = await this.jwtService.signAsync({
      sub: userId,
      username,
      email,
    });

    const refreshToken = randomBytes(48).toString('hex');
    const refreshTokenHash = this.hashToken(refreshToken);
    const refreshTokenTtlDays = this.configService.get<number>('refreshTokenTtlDays') ?? 30;
    const expiresAt = new Date(Date.now() + refreshTokenTtlDays * 24 * 60 * 60 * 1000);

    await this.prisma.session.create({
      data: {
        userId,
        refreshTokenHash,
        tokenFamilyId: existingTokenFamilyId ?? randomBytes(16).toString('hex'),
        userAgent: req.get('user-agent'),
        ipAddress: req.ip,
        expiresAt,
        lastUsedAt: new Date(),
      },
    });

    res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
      httpOnly: true,
      secure: this.configService.get<string>('nodeEnv') === 'production',
      sameSite: 'lax',
      path: '/api/v1/auth',
      expires: expiresAt,
    });

    return {
      accessToken,
      user: await this.usersService.getPublicUserById(userId),
    };
  }

  private clearRefreshCookie(res: Response) {
    res.clearCookie(REFRESH_COOKIE_NAME, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/api/v1/auth',
    });
  }

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private getRefreshTokenFromRequest(req: RequestWithCookies): string | undefined {
    const cookies = req.cookies as Record<string, unknown> | undefined;
    const cookieValue = cookies?.[REFRESH_COOKIE_NAME];
    return typeof cookieValue === 'string' ? cookieValue : undefined;
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

  private generateOneTimeToken(ttlMs?: number) {
    const token = randomBytes(32).toString('hex');
    const defaultTtlHours = this.configService.get<number>('emailVerificationTtlHours') ?? 24;
    const expiresAt = new Date(Date.now() + (ttlMs ?? defaultTtlHours * 60 * 60 * 1000));

    return { token, expiresAt };
  }

  private buildTokenPreview(type: 'email_verification' | 'password_reset', token: string, expiresAt: Date) {
    if (this.configService.get<string>('nodeEnv') === 'production') {
      return undefined;
    }

    return {
      type,
      token,
      expiresAt,
    };
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
