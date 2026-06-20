import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import * as Sentry from '@sentry/node';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request & { requestId?: string }>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : null;

    // Report non-HttpException errors (unhandled 500s) to Sentry
    if (!(exception instanceof HttpException)) {
      const sentryAvailable = !!process.env.SENTRY_DSN;
      if (sentryAvailable) {
        Sentry.withScope((scope) => {
          scope.setExtra('requestId', request.requestId);
          scope.setExtra('path', request.url);
          scope.setExtra('method', request.method);
          scope.setTag('route', request.url);
          Sentry.captureException(exception);
        });
      }
    }

    response.status(status).json({
      error: {
        statusCode: status,
        message:
          typeof exceptionResponse === 'object' && exceptionResponse !== null
            ? exceptionResponse
            : 'Internal server error',
        path: request.url,
        requestId: request.requestId ?? null,
        timestamp: new Date().toISOString(),
      },
    });
  }
}
