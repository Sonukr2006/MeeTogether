import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

type LikeEntityType = 'post' | 'project';

type LikeIntent = {
  entityType: LikeEntityType;
  entityId: string;
  userId: string;
  liked: boolean;
};

@Injectable()
export class LikesService {
  private readonly logger = new Logger(LikesService.name);

  constructor(private readonly configService: ConfigService) {}

  isQueueEnabled() {
    const provider = this.configService.get<string>('likes.provider') ?? 'direct';
    return provider === 'upstash';
  }

  getPollIntervalMs() {
    return this.configService.get<number>('likes.queuePollIntervalMs') ?? 750;
  }

  async enqueue(intent: LikeIntent) {
    const { restUrl, restToken, queueTtlSeconds } = this.getUpstashConfig();

    const jobKey = this.toJobKey(intent);
    const stateKey = this.toStateKey(intent.entityType, jobKey);

    await this.runPipeline(restUrl, restToken, [
      ['SET', stateKey, JSON.stringify(intent), 'EX', queueTtlSeconds],
      ['SADD', this.getQueueKey(intent.entityType), jobKey],
    ]);
  }

  async popIntent(entityType: LikeEntityType) {
    const { restUrl, restToken } = this.getUpstashConfig();
    const poppedKey = await this.runCommand<string | null>(restUrl, restToken, [
      'SPOP',
      this.getQueueKey(entityType),
    ]);

    if (!poppedKey) {
      return null;
    }

    const payload = await this.runCommand<string | null>(restUrl, restToken, [
      'GET',
      this.toStateKey(entityType, poppedKey),
    ]);

    if (!payload) {
      return null;
    }

    try {
      const parsed = JSON.parse(payload) as LikeIntent;
      if (parsed.entityType !== entityType) {
        return null;
      }

      return parsed;
    } catch (error) {
      this.logger.warn(`Failed to parse queued like intent for ${entityType}: ${poppedKey}`);
      return null;
    }
  }

  private getQueueKey(entityType: LikeEntityType) {
    return `likes:pending:${entityType}`;
  }

  private toJobKey(intent: Omit<LikeIntent, 'liked'> | LikeIntent) {
    return `${intent.entityId}:${intent.userId}`;
  }

  private toStateKey(entityType: LikeEntityType, jobKey: string) {
    return `likes:state:${entityType}:${jobKey}`;
  }

  private getUpstashConfig() {
    const restUrl = this.configService.get<string>('likes.upstashRestUrl') ?? '';
    const restToken = this.configService.get<string>('likes.upstashRestToken') ?? '';
    const queueTtlSeconds = this.configService.get<number>('likes.queueTtlSeconds') ?? 300;

    if (!restUrl || !restToken) {
      throw new Error('UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are required for queued likes.');
    }

    return { restUrl, restToken, queueTtlSeconds };
  }

  private async runPipeline(
    restUrl: string,
    restToken: string,
    commands: Array<Array<string | number>>,
  ) {
    const response = await fetch(`${restUrl}/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${restToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(commands),
    });

    if (!response.ok) {
      throw new Error(`Upstash pipeline failed with status ${response.status}`);
    }

    const payload = (await response.json()) as Array<{ result?: unknown; error?: string }>;
    const firstError = payload.find((entry) => entry.error);

    if (firstError?.error) {
      throw new Error(firstError.error);
    }

    return payload;
  }

  private async runCommand<T>(restUrl: string, restToken: string, command: Array<string | number>) {
    const response = await fetch(restUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${restToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(command),
    });

    if (!response.ok) {
      throw new Error(`Upstash command failed with status ${response.status}`);
    }

    const payload = (await response.json()) as { result?: T; error?: string };

    if (payload.error) {
      throw new Error(payload.error);
    }

    return (payload.result ?? null) as T;
  }
}
