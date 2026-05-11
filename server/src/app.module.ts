import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { validateEnv } from './config/env.validation';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { DeploymentsModule } from './modules/deployments/deployments.module';
import { DiscussionsModule } from './modules/discussions/discussions.module';
import { EmailModule } from './modules/email/email.module';
import { HealthModule } from './modules/health/health.module';
import { IssuesModule } from './modules/issues/issues.module';
import { ProfilesModule } from './modules/profiles/profiles.module';
import { PostsModule } from './modules/posts/posts.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { RequestsModule } from './modules/requests/requests.module';
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
    AuthModule,
    DeploymentsModule,
    DiscussionsModule,
    EmailModule,
    HealthModule,
    IssuesModule,
    UsersModule,
    ProfilesModule,
    PostsModule,
    ProjectsModule,
    RequestsModule,
    StorageModule,
  ],
})
export class AppModule {}
