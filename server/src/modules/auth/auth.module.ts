import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import type { StringValue } from 'ms';
import { EmailModule } from '../email/email.module';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { DebugAuthController } from './debug-auth.controller';
import { AuthService } from './auth.service';
import { VerifiedAccountGuard } from './guards/verified-account.guard';
import { JwtStrategy } from './strategies/jwt.strategy';

const controllers: any[] = [AuthController];

// Only register the debug controller in non-production environments
if (process.env.NODE_ENV !== 'production') {
  controllers.push(DebugAuthController);
}

@Module({
  imports: [
    PassportModule,
    EmailModule,
    UsersModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('jwt.accessSecret'),
        signOptions: {
          expiresIn: configService.getOrThrow<string>('jwt.accessTtl') as StringValue,
        },
      }),
    }),
  ],
  controllers,
  providers: [AuthService, JwtStrategy, VerifiedAccountGuard],
  exports: [AuthService, JwtStrategy, VerifiedAccountGuard],
})
export class AuthModule {}
