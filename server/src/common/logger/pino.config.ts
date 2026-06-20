import { Options } from 'pino-http';
import { IncomingMessage, ServerResponse } from 'http';

export const pinoHttpOptions: Options = {
  level: process.env.LOG_LEVEL ?? 'info',
  redact: {
    paths: [
      'req.headers.authorization',
      'req.body.password',
      'req.body.newPassword',
      'req.body.token',
    ],
    censor: '[REDACTED]',
  },
  serializers: {
    req(req: IncomingMessage & { id?: string; remoteAddress?: string }) {
      return {
        id: req.id,
        method: req.method,
        url: req.url,
        remoteAddress: req.remoteAddress ?? req.socket?.remoteAddress,
      };
    },
    res(res: ServerResponse) {
      return {
        statusCode: res.statusCode,
      };
    },
  },
  customProps(req: IncomingMessage) {
    const r = req as IncomingMessage & { requestId?: string; id?: string; user?: { sub?: string } };
    return {
      requestId: r.requestId ?? r.id ?? null,
      userId: r.user?.sub ?? null,
    };
  },
  transport: process.env.NODE_ENV !== 'production'
    ? { target: 'pino-pretty', options: { colorize: true } }
    : undefined,
};
