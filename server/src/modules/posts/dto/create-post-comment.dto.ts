import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreatePostCommentDto {
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  message!: string;
}
