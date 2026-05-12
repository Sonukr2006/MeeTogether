import { plainToInstance } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  validateSync,
} from 'class-validator';

class EnvVariables {
  @IsIn(['development', 'test', 'production'])
  NODE_ENV!: string;

  @IsInt()
  @Min(1)
  PORT!: number;

  @IsString()
  @IsNotEmpty()
  DATABASE_URL!: string;

  @IsOptional()
  @IsString()
  DIRECT_URL?: string;

  @IsString()
  @IsNotEmpty()
  JWT_ACCESS_SECRET!: string;

  @IsString()
  @IsNotEmpty()
  JWT_ACCESS_TTL!: string;

  @IsInt()
  @Min(1)
  REFRESH_TOKEN_TTL_DAYS!: number;

  @IsInt()
  @Min(1)
  EMAIL_VERIFICATION_TTL_HOURS!: number;

  @IsInt()
  @Min(1)
  PASSWORD_RESET_TTL_MINUTES!: number;

  @IsString()
  @IsNotEmpty()
  APP_BASE_URL!: string;

  @IsString()
  @IsNotEmpty()
  EMAIL_PROVIDER!: string;

  @IsString()
  @IsNotEmpty()
  EMAIL_FROM!: string;

  @IsString()
  RESEND_API_KEY!: string;

  @IsString()
  @IsNotEmpty()
  CLIENT_ORIGIN!: string;

  @IsOptional()
  @IsString()
  AUTH_COOKIE_DOMAIN?: string;

  @IsOptional()
  @IsIn(['lax', 'strict', 'none'])
  AUTH_COOKIE_SAME_SITE?: string;

  @IsOptional()
  @IsIn(['supabase', 's3'])
  STORAGE_PROVIDER?: string;

  @IsOptional()
  @IsString()
  SUPABASE_URL?: string;

  @IsOptional()
  @IsString()
  SUPABASE_SERVICE_ROLE_KEY?: string;

  @IsOptional()
  @IsString()
  SUPABASE_STORAGE_BUCKET?: string;

  @IsOptional()
  @IsString()
  AWS_REGION?: string;

  @IsOptional()
  @IsString()
  AWS_ACCESS_KEY_ID?: string;

  @IsOptional()
  @IsString()
  AWS_SECRET_ACCESS_KEY?: string;

  @IsOptional()
  @IsString()
  S3_BUCKET_NAME?: string;

  @IsOptional()
  @IsString()
  CLOUDFRONT_BASE_URL?: string;

  @IsOptional()
  @IsInt()
  @Min(60)
  S3_UPLOAD_URL_TTL_SECONDS?: number;

  @IsOptional()
  @IsIn(['direct', 'upstash'])
  LIKE_WRITE_PROVIDER?: string;

  @IsOptional()
  @IsString()
  UPSTASH_REDIS_REST_URL?: string;

  @IsOptional()
  @IsString()
  UPSTASH_REDIS_REST_TOKEN?: string;

  @IsOptional()
  @IsInt()
  @Min(100)
  LIKE_QUEUE_POLL_INTERVAL_MS?: number;

  @IsOptional()
  @IsInt()
  @Min(30)
  LIKE_QUEUE_TTL_SECONDS?: number;
}

export function validateEnv(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validatedConfig, { skipMissingProperties: false });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }

  return validatedConfig;
}
