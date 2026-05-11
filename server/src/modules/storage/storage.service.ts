import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { CreateUploadTargetDto } from './dto/create-upload-target.dto';

@Injectable()
export class StorageService {
  private s3Client: S3Client | null = null;
  private supabaseClient: SupabaseClient | null = null;

  constructor(private readonly configService: ConfigService) {}

  async createUploadTarget(
    user: AuthenticatedUser,
    createUploadTargetDto: CreateUploadTargetDto,
  ) {
    this.validateUploadTarget(createUploadTargetDto);

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
    const { data, error } = await storage.createSignedUploadUrl(storageKey);

    if (error || !data) {
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
    const required = [
      this.configService.get<string>('storage.supabaseUrl'),
      this.configService.get<string>('storage.supabaseServiceRoleKey'),
      this.configService.get<string>('storage.supabaseStorageBucket'),
    ];

    if (required.some((value) => !value)) {
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
        },
      );
    }

    return this.supabaseClient;
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
