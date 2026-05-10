import { Request, Response, NextFunction } from 'express';

type RateLimitOptions = {
  windowMs: number;
  maxRequests: number;
  message: string;
};

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

function getClientKey(req: Request) {
  return req.ip || req.socket.remoteAddress || 'unknown';
}

export function createRateLimitMiddleware(options: RateLimitOptions) {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = `${req.method}:${req.path}:${getClientKey(req)}`;
    const now = Date.now();
    const existing = buckets.get(key);

    if (!existing || existing.resetAt <= now) {
      buckets.set(key, {
        count: 1,
        resetAt: now + options.windowMs,
      });
      return next();
    }

    if (existing.count >= options.maxRequests) {
      const retryAfterSeconds = Math.ceil((existing.resetAt - now) / 1000);
      res.setHeader('retry-after', retryAfterSeconds.toString());
      return res.status(429).json({
        error: {
          statusCode: 429,
          message: options.message,
          path: req.originalUrl,
          timestamp: new Date().toISOString(),
        },
      });
    }

    existing.count += 1;
    buckets.set(key, existing);
    return next();
  };
}
