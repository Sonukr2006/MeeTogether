import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { CreateUploadTargetDto } from './dto/create-upload-target.dto';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private s3Client: S3Client | null = null;
  private supabaseClient: SupabaseClient | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async onModuleInit() {
    const provider = this.configService.get<string>('storage.provider') ?? 'supabase';
    if (provider !== 'supabase') return;

    const url = this.configService.get<string>('storage.supabaseUrl');
    const key = this.configService.get<string>('storage.supabaseServiceRoleKey');
    const bucket = this.configService.get<string>('storage.supabaseStorageBucket');

    this.logger.log(`Supabase storage config: url=${url ? 'SET' : 'MISSING'}, key=${key ? key.substring(0, 12) + '...' : 'MISSING'}, bucket=${bucket ?? 'MISSING'}`);

    if (!url || !key || !bucket) return;

    try {
      const client = createClient(url, key, {
        auth: { persistSession: false, autoRefreshToken: false },
        realtime: { params: { eventsPerSecond: 0 } },
      });
      const { data, error } = await client.storage.listBuckets();
      if (error) {
        this.logger.error(`Supabase health check FAILED: ${error.message}`);
      } else {
        const bucketNames = data?.map((b) => b.name) ?? [];
        this.logger.log(`Supabase health check OK. Buckets: [${bucketNames.join(', ')}]`);
        if (!bucketNames.includes(bucket)) {
          this.logger.error(`Bucket "${bucket}" NOT FOUND in Supabase. Available: [${bucketNames.join(', ')}]`);
        }
      }
    } catch (e: unknown) {
      this.logger.error(`Supabase health check exception: ${(e as Error).message}`);
    }
  }

  async createUploadTarget(
    user: AuthenticatedUser,
    createUploadTargetDto: CreateUploadTargetDto,
  ) {
    this.validateUploadTarget(createUploadTargetDto);

    if (
      createUploadTargetDto.entityId &&
      (createUploadTargetDto.entityType === 'project_cover' ||
        createUploadTargetDto.entityType === 'post_image')
    ) {
      await this.validateOwnership(
        createUploadTargetDto.entityType,
        createUploadTargetDto.entityId,
        user.sub,
      );
    }

    const storageKey = this.buildStorageKey(user.sub, createUploadTargetDto);
    const provider = this.configService.get<'supabase' | 's3'>('storage.provider') ?? 'supabase';

    if (provider === 's3') {
      return this.createS3UploadTarget(storageKey, createUploadTargetDto.contentType);
    }

    return this.createSupabaseUploadTarget(storageKey);
  }

  private async createS3UploadTarget(storageKey: string, contentType: string) {
    this.ensureS3Configured();

    const bucket = this.configService.get<string>('storage.s3BucketName')!;
    const expiresInSeconds =
      this.configService.get<number>('storage.uploadUrlTtlSeconds') ?? 300;
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: storageKey,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000, immutable',
    });

    const uploadUrl = await getSignedUrl(this.getS3Client(), command, {
      expiresIn: expiresInSeconds,
    });

    return {
      provider: 's3' as const,
      uploadStrategy: 'presigned_put' as const,
      uploadUrl,
      storageKey,
      cdnUrl: this.buildS3CdnUrl(storageKey),
      expiresInSeconds,
    };
  }

  private async createSupabaseUploadTarget(storageKey: string) {
    this.ensureSupabaseConfigured();

    const bucket = this.configService.get<string>('storage.supabaseStorageBucket')!;
    const storage = this.getSupabaseClient().storage.from(bucket);

    let data: { signedUrl: string; token: string; path: string } | null = null;
    let error: { message: string; name?: string } | null = null;

    try {
      const result = await storage.createSignedUploadUrl(storageKey);
      data = result.data;
      error = result.error;
    } catch (e: unknown) {
      const err = e as Error;
      console.error(
        JSON.stringify({
          level: 'error',
          event: 'supabase_upload_exception',
          bucket,
          storageKey,
          errorMessage: err.message,
          errorStack: err.stack?.split('\n').slice(0, 3).join(' | '),
          timestamp: new Date().toISOString(),
        }),
      );
      throw new InternalServerErrorException(
        `Supabase upload failed: ${err.message}`,
      );
    }

    if (error || !data) {
      console.error(
        JSON.stringify({
          level: 'error',
          event: 'supabase_upload_target_failed',
          bucket,
          storageKey,
          errorMessage: error?.message ?? 'No data returned',
          errorName: error?.name ?? 'unknown',
          timestamp: new Date().toISOString(),
        }),
      );
      throw new InternalServerErrorException(
        error?.message ?? 'Failed to create a Supabase signed upload URL.',
      );
    }

    const publicUrl = storage.getPublicUrl(storageKey).data.publicUrl;

    return {
      provider: 'supabase' as const,
      uploadStrategy: 'supabase_signed_upload' as const,
      uploadUrl: data.signedUrl,
      storageKey,
      cdnUrl: publicUrl,
      token: data.token,
      path: data.path,
      expiresInSeconds: 7200,
    };
  }

  private ensureS3Configured() {
    const required = [
      this.configService.get<string>('storage.awsRegion'),
      this.configService.get<string>('storage.awsAccessKeyId'),
      this.configService.get<string>('storage.awsSecretAccessKey'),
      this.configService.get<string>('storage.s3BucketName'),
      this.configService.get<string>('storage.cloudFrontBaseUrl'),
    ];

    if (required.some((value) => !value)) {
      throw new InternalServerErrorException(
        'Storage is not configured. Set AWS, S3, and CloudFront environment variables first.',
      );
    }
  }

  private ensureSupabaseConfigured() {
    const supabaseUrl = this.configService.get<string>('storage.supabaseUrl');
    const supabaseKey = this.configService.get<string>('storage.supabaseServiceRoleKey');
    const bucket = this.configService.get<string>('storage.supabaseStorageBucket');

    const required = [supabaseUrl, supabaseKey, bucket];

    if (required.some((value) => !value)) {
      console.error(
        JSON.stringify({
          level: 'error',
          event: 'supabase_config_missing',
          hasUrl: !!supabaseUrl,
          hasKey: !!supabaseKey,
          hasBucket: !!bucket,
          bucketValue: bucket ?? 'undefined',
          timestamp: new Date().toISOString(),
        }),
      );
      throw new InternalServerErrorException(
        'Storage is not configured. Set Supabase Storage environment variables first.',
      );
    }
  }

  private getS3Client() {
    if (!this.s3Client) {
      this.s3Client = new S3Client({
        region: this.configService.get<string>('storage.awsRegion'),
        credentials: {
          accessKeyId: this.configService.get<string>('storage.awsAccessKeyId')!,
          secretAccessKey: this.configService.get<string>('storage.awsSecretAccessKey')!,
        },
      });
    }

    return this.s3Client;
  }

  private getSupabaseClient() {
    if (!this.supabaseClient) {
      this.supabaseClient = createClient(
        this.configService.get<string>('storage.supabaseUrl')!,
        this.configService.get<string>('storage.supabaseServiceRoleKey')!,
        {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          },
          realtime: {
            params: { eventsPerSecond: 0 },
          },
          global: {
            headers: { 'X-Client-Info': 'meetogether-server' },
          },
        },
      );
    }

    return this.supabaseClient;
  }

  private async validateOwnership(
    entityType: 'project_cover' | 'post_image',
    entityId: string,
    userId: string,
  ): Promise<void> {
    if (entityType === 'project_cover') {
      const project = await this.prisma.project.findUnique({
        where: { id: entityId },
        select: { ownerUserId: true },
      });
      if (!project) throw new NotFoundException('Project not found');
      if (project.ownerUserId !== userId) throw new ForbiddenException('You do not own this project');
    } else if (entityType === 'post_image') {
      const post = await this.prisma.post.findUnique({
        where: { id: entityId },
        select: { authorUserId: true },
      });
      if (!post) throw new NotFoundException('Post not found');
      if (post.authorUserId !== userId) throw new ForbiddenException('You do not own this post');
    }
  }

  private buildStorageKey(
    userId: string,
    createUploadTargetDto: CreateUploadTargetDto,
  ) {
    const safeFileName = this.sanitizeFileName(createUploadTargetDto.fileName);
    const suffix = `${Date.now()}-${randomUUID()}`;

    switch (createUploadTargetDto.entityType) {
      case 'avatar':
        return `users/${userId}/avatar/${suffix}-${safeFileName}`;
      case 'project_cover':
        return createUploadTargetDto.entityId
          ? `projects/${createUploadTargetDto.entityId}/cover/${suffix}-${safeFileName}`
          : `projects/drafts/${userId}/cover/${suffix}-${safeFileName}`;
      case 'post_image':
        return createUploadTargetDto.entityId
          ? `posts/${createUploadTargetDto.entityId}/media/${suffix}-${safeFileName}`
          : `posts/drafts/${userId}/media/${suffix}-${safeFileName}`;
      default:
        throw new BadRequestException('Unsupported media entity type');
    }
  }

  private validateUploadTarget(createUploadTargetDto: CreateUploadTargetDto) {
    if (createUploadTargetDto.fileSizeBytes && createUploadTargetDto.fileSizeBytes > 8 * 1024 * 1024) {
      throw new BadRequestException('Images must be 8 MB or smaller.');
    }

    if (!createUploadTargetDto.fileName.includes('.')) {
      throw new BadRequestException('Uploaded files must include an extension.');
    }
  }

  private buildS3CdnUrl(storageKey: string) {
    const baseUrl = this.configService
      .get<string>('storage.cloudFrontBaseUrl')!
      .replace(/\/+$/, '');
    return `${baseUrl}/${storageKey}`;
  }

  private sanitizeFileName(fileName: string) {
    return fileName
      .toLowerCase()
      .replace(/[^a-z0-9.\-_]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }
}
