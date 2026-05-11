export default () => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 4000),
  databaseUrl: process.env.DATABASE_URL ?? '',
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET ?? '',
    accessTtl: process.env.JWT_ACCESS_TTL ?? '15m',
  },
  refreshTokenTtlDays: Number(process.env.REFRESH_TOKEN_TTL_DAYS ?? 30),
  emailVerificationTtlHours: Number(process.env.EMAIL_VERIFICATION_TTL_HOURS ?? 24),
  passwordResetTtlMinutes: Number(process.env.PASSWORD_RESET_TTL_MINUTES ?? 30),
  appBaseUrl: process.env.APP_BASE_URL ?? 'http://localhost:5173',
  email: {
    provider: process.env.EMAIL_PROVIDER ?? 'console',
    from: process.env.EMAIL_FROM ?? 'noreply@meetogether.dev',
    resendApiKey: process.env.RESEND_API_KEY ?? '',
  },
  storage: {
    provider: process.env.STORAGE_PROVIDER ?? 'supabase',
    supabaseUrl: process.env.SUPABASE_URL ?? '',
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
    supabaseStorageBucket: process.env.SUPABASE_STORAGE_BUCKET ?? '',
    awsRegion: process.env.AWS_REGION ?? '',
    awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID ?? '',
    awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? '',
    s3BucketName: process.env.S3_BUCKET_NAME ?? '',
    cloudFrontBaseUrl: process.env.CLOUDFRONT_BASE_URL ?? '',
    uploadUrlTtlSeconds: Number(process.env.S3_UPLOAD_URL_TTL_SECONDS ?? 300),
  },
  likes: {
    provider: process.env.LIKE_WRITE_PROVIDER ?? 'direct',
    upstashRestUrl: process.env.UPSTASH_REDIS_REST_URL ?? '',
    upstashRestToken: process.env.UPSTASH_REDIS_REST_TOKEN ?? '',
    queuePollIntervalMs: Number(process.env.LIKE_QUEUE_POLL_INTERVAL_MS ?? 750),
    queueTtlSeconds: Number(process.env.LIKE_QUEUE_TTL_SECONDS ?? 300),
  },
  clientOrigins: (process.env.CLIENT_ORIGIN ?? 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
});
