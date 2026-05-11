import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreatePostDto {
  @IsString()
  @IsIn(['Build Log', 'Help Needed', 'Mentor Review', 'Launch', 'Professional Update'])
  type!:
    | 'Build Log'
    | 'Help Needed'
    | 'Mentor Review'
    | 'Launch'
    | 'Professional Update';

  @IsString()
  @MinLength(3)
  @MaxLength(140)
  title!: string;

  @IsString()
  @MinLength(20)
  @MaxLength(4000)
  description!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  projectId?: string;

  @IsOptional()
  @IsUrl({ require_tld: false }, { message: 'Post image URL must be valid' })
  imageUrl?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(8)
  @IsString({ each: true })
  @MaxLength(30, { each: true })
  tags?: string[];
}
