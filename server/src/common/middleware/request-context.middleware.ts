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

  next();
}
