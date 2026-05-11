import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateUploadTargetDto {
  @IsString()
  @IsIn(['avatar', 'project_cover', 'post_image'])
  entityType!: 'avatar' | 'project_cover' | 'post_image';

  @IsString()
  @MaxLength(255)
  fileName!: string;

  @IsString()
  @IsIn(['image/jpeg', 'image/png', 'image/webp'])
  contentType!: 'image/jpeg' | 'image/png' | 'image/webp';

  @IsOptional()
  @IsString()
  @MaxLength(120)
  entityId?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(8 * 1024 * 1024)
  fileSizeBytes?: number;
}
