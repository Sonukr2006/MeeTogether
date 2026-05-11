import { IsString, IsUrl, MaxLength, MinLength } from 'class-validator';

export class CreatePostLinkDto {
  @IsString()
  @MinLength(1)
  @MaxLength(40)
  label!: string;

  @IsString()
  @IsUrl(
    { require_tld: false },
    { message: 'Post link URL must be valid' },
  )
  @MaxLength(2048)
  url!: string;
}
