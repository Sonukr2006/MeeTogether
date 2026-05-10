import { plainToInstance } from 'class-transformer';
import { IsIn, IsInt, IsNotEmpty, IsString, Min, validateSync } from 'class-validator';

class EnvVariables {
  @IsIn(['development', 'test', 'production'])
  NODE_ENV!: string;

  @IsInt()
  @Min(1)
  PORT!: number;

  @IsString()
  @IsNotEmpty()
  DATABASE_URL!: string;

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
