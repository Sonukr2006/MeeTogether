import { Request, Response, NextFunction } from 'express';
import Redis from 'ioredis';

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
let redisClient: Redis | null = null;

export function initializeRateLimitStore(redisUrl?: string) {
  if (!redisUrl || redisClient) {
    return;
  }

  redisClient = new Redis(redisUrl, {
    maxRetriesPerRequest: 3,
    connectTimeout: 10000,
    keyPrefix: 'rate-limit:',
  });

  redisClient.on('error', () => {
    redisClient = null;
  });

  redisClient.on('end', () => {
    redisClient = null;
  });
}

function getClientKey(req: Request) {
  return req.ip || req.socket.remoteAddress || 'unknown';
}

async function getRedisCount(key: string, windowSeconds: number) {
  if (!redisClient) {
    return null;
  }

  const result = await redisClient.multi().incr(key).expire(key, windowSeconds).exec();

  if (!result || result.length < 2) {
    return null;
  }

  const count = result[0][1] as number | null;
  return count ?? null;
}

export function createRateLimitMiddleware(options: RateLimitOptions) {
  const windowSeconds = Math.ceil(options.windowMs / 1000);

  return async (req: Request, res: Response, next: NextFunction) => {
    const key = `${req.method}:${req.path}:${getClientKey(req)}`;
    const now = Date.now();

    if (redisClient) {
      try {
        const count = await getRedisCount(key, windowSeconds);
        if (count !== null) {
          if (count > options.maxRequests) {
            const retryAfterSeconds = windowSeconds;
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

          return next();
        }
      } catch {
        // Redis unavailable, fall back to in-memory rate limiting.
      }
    }

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
