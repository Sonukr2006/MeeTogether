import { Module, OnModuleDestroy } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { validateEnv } from './config/env.validation';
import { shutdownRateLimiter } from './common/middleware/rate-limit.middleware';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { DeploymentsModule } from './modules/deployments/deployments.module';
import { DiscussionsModule } from './modules/discussions/discussions.module';
import { EmailModule } from './modules/email/email.module';
import { HealthModule } from './modules/health/health.module';
import { IssuesModule } from './modules/issues/issues.module';
import { LikesModule } from './modules/likes/likes.module';
import { MetricsModule } from './modules/metrics/metrics.module';
import { ProfilesModule } from './modules/profiles/profiles.module';
import { PostsModule } from './modules/posts/posts.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { RequestsModule } from './modules/requests/requests.module';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { StorageModule } from './modules/storage/storage.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate: validateEnv,
      envFilePath: ['.env.local', '.env'],
    }),
    PrismaModule,
    PermissionsModule,
    AuthModule,
    DeploymentsModule,
    DiscussionsModule,
    EmailModule,
    HealthModule,
    IssuesModule,
    LikesModule,
    MetricsModule,
    UsersModule,
    ProfilesModule,
    PostsModule,
    ProjectsModule,
    RequestsModule,
    StorageModule,
  ],
})
export class AppModule implements OnModuleDestroy {
  onModuleDestroy() {
    shutdownRateLimiter();
  }
}
