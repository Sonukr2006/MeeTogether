import { json, urlencoded } from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { createRateLimitMiddleware } from './common/middleware/rate-limit.middleware';
import { requestContextMiddleware } from './common/middleware/request-context.middleware';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const configService = app.get(ConfigService);
  const clientOrigins =
    configService.get<string[]>('clientOrigins') ?? ['http://localhost:5173'];
  const port = configService.get<number>('port') ?? 4000;

  app.use(requestContextMiddleware);
  app.use(helmet());
  app.use(json({ limit: '1mb' }));
  app.use(urlencoded({ extended: true, limit: '1mb' }));
  app.use(cookieParser());
  app.enableCors({
    origin: clientOrigins,
    credentials: true,
  });
  app.use(
    '/api/v1/auth/signup',
    createRateLimitMiddleware({
      windowMs: 15 * 60 * 1000,
      maxRequests: 10,
      message: 'Too many signup attempts. Please try again later.',
    }),
  );
  app.use(
    '/api/v1/auth/login',
    createRateLimitMiddleware({
      windowMs: 15 * 60 * 1000,
      maxRequests: 20,
      message: 'Too many login attempts. Please try again later.',
    }),
  );
  app.use(
    '/api/v1/auth/forgot-password',
    createRateLimitMiddleware({
      windowMs: 15 * 60 * 1000,
      maxRequests: 8,
      message: 'Too many password reset requests. Please try again later.',
    }),
  );
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  app.setGlobalPrefix('api/v1');

  await app.listen(port);
}

void bootstrap();
