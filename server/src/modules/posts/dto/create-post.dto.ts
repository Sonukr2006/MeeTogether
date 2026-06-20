import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreatePostLinkDto } from './create-post-link.dto';

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
  @MaxLength(10000)
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

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(4)
  @ValidateNested({ each: true })
  @Type(() => CreatePostLinkDto)
  @IsObject({ each: true })
  links?: CreatePostLinkDto[];
}
