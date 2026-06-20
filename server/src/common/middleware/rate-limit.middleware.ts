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
let cleanupTimer: NodeJS.Timeout | null = null;

const MAX_BUCKETS = parseInt(process.env.RATE_LIMIT_MAX_BUCKETS ?? '100000', 10);

// Redis reconnection state
let storedRedisUrl: string | null = null;
let reconnectAttempts = 0;
let permanentFallback = false;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

const MAX_RECONNECT_ATTEMPTS = 10;
const MAX_BACKOFF_MS = 30_000;

function scheduleReconnect() {
  if (permanentFallback || reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
    permanentFallback = true;
    console.error(
      JSON.stringify({
        level: 'error',
        event: 'redis_reconnection_exhausted',
        message:
          'Redis reconnection attempts exhausted — permanent in-memory fallback activated',
        attempts: reconnectAttempts,
        timestamp: new Date().toISOString(),
      }),
    );
    return;
  }

  const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), MAX_BACKOFF_MS);
  reconnectAttempts++;

  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    attemptReconnect();
  }, delay);
}

function attemptReconnect() {
  if (!storedRedisUrl || permanentFallback) {
    return;
  }

  const newClient = new Redis(storedRedisUrl, {
    maxRetriesPerRequest: 3,
    connectTimeout: 10000,
    keyPrefix: 'rate-limit:',
    lazyConnect: true,
  });

  newClient
    .connect()
    .then(() => {
      redisClient = newClient;
      reconnectAttempts = 0;

      console.info(
        JSON.stringify({
          level: 'info',
          event: 'redis_reconnected',
          message:
            'Redis reconnection successful — resuming Redis-backed rate limiting',
          timestamp: new Date().toISOString(),
        }),
      );

      attachRedisEventHandlers(newClient);
    })
    .catch(() => {
      newClient.disconnect();
      scheduleReconnect();
    });
}

function attachRedisEventHandlers(client: Redis) {
  client.on('error', () => {
    if (redisClient === client) {
      redisClient = null;
    }
    scheduleReconnect();
  });

  client.on('end', () => {
    if (redisClient === client) {
      redisClient = null;
    }
    scheduleReconnect();
  });
}

export function startCleanupInterval() {
  if (cleanupTimer) {
    return;
  }
  cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of buckets) {
      if (bucket.resetAt <= now) {
        buckets.delete(key);
      }
    }
  }, 30_000);
}

export function shutdownRateLimiter() {
  if (cleanupTimer) {
    clearInterval(cleanupTimer);
    cleanupTimer = null;
  }
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  buckets.clear();
}

export function initializeRateLimitStore(redisUrl?: string) {
  startCleanupInterval();

  if (!redisUrl || redisClient) {
    return;
  }

  storedRedisUrl = redisUrl;

  redisClient = new Redis(redisUrl, {
    maxRetriesPerRequest: 3,
    connectTimeout: 10000,
    keyPrefix: 'rate-limit:',
  });

  attachRedisEventHandlers(redisClient);
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

    // Log degraded mode warning when Redis is unavailable
    if (!redisClient && storedRedisUrl) {
      if (permanentFallback) {
        console.warn(
          JSON.stringify({
            level: 'warn',
            event: 'rate_limit_degraded_mode',
            message:
              'Rate limiter operating in degraded mode — Redis permanently unavailable',
            path: req.originalUrl,
            timestamp: new Date().toISOString(),
          }),
        );
      } else {
        console.warn(
          JSON.stringify({
            level: 'warn',
            event: 'rate_limit_degraded_mode',
            message:
              'Rate limiter operating in degraded mode — Redis disconnected, reconnection in progress',
            path: req.originalUrl,
            reconnectAttempts,
            timestamp: new Date().toISOString(),
          }),
        );
      }
    }

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

    // In-memory fallback: check bucket cap
    if (!buckets.has(key) && buckets.size >= MAX_BUCKETS) {
      res.setHeader('retry-after', windowSeconds.toString());
      return res.status(429).json({
        error: {
          statusCode: 429,
          message: options.message,
          path: req.originalUrl,
          timestamp: new Date().toISOString(),
        },
      });
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

// Exported for testing purposes
export function _getReconnectionState() {
  return {
    reconnectAttempts,
    permanentFallback,
    storedRedisUrl,
    hasRedisClient: redisClient !== null,
  };
}

export function _resetReconnectionState() {
  reconnectAttempts = 0;
  permanentFallback = false;
  storedRedisUrl = null;
  redisClient = null;
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
}
