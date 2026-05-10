import { randomUUID } from 'crypto';
import { Request, Response, NextFunction } from 'express';

type RequestWithId = Request & {
  requestId?: string;
};

export function requestContextMiddleware(
  req: RequestWithId,
  res: Response,
  next: NextFunction,
) {
  const requestId = req.header('x-request-id') || randomUUID();
  req.requestId = requestId;
  res.setHeader('x-request-id', requestId);

  const startTime = Date.now();

  res.on('finish', () => {
    const latencyMs = Date.now() - startTime;
    const logPayload = {
      level: res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info',
      requestId,
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      latencyMs,
      ip: req.ip,
      userAgent: req.get('user-agent') ?? null,
      timestamp: new Date().toISOString(),
    };

    console.log(JSON.stringify(logPayload));
  });

  next();
}
