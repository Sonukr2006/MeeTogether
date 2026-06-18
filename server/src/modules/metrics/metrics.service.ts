import { Injectable, OnModuleInit } from '@nestjs/common';
import { collectDefaultMetrics, Counter, Histogram, Registry } from 'prom-client';

@Injectable()
export class MetricsService implements OnModuleInit {
  private readonly registry = new Registry();

  readonly httpRequestDuration = new Histogram({
    name: 'http_request_duration_seconds',
    help: 'HTTP request duration in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
    registers: [this.registry],
  });

  readonly httpRequestTotal = new Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code'],
    registers: [this.registry],
  });

  readonly signupTotal = new Counter({
    name: 'meetogether_signup_total',
    help: 'Total signups',
    registers: [this.registry],
  });

  readonly loginTotal = new Counter({
    name: 'meetogether_login_total',
    help: 'Total logins',
    registers: [this.registry],
  });

  readonly messageCreatedTotal = new Counter({
    name: 'meetogether_message_created_total',
    help: 'Total discussion messages created',
    registers: [this.registry],
  });

  readonly requestCreatedTotal = new Counter({
    name: 'meetogether_request_created_total',
    help: 'Total opportunity requests created',
    registers: [this.registry],
  });

  onModuleInit() {
    collectDefaultMetrics({ register: this.registry });
  }

  async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }

  getContentType(): string {
    return this.registry.contentType;
  }
}
