import { IsBoolean } from 'class-validator';

export class SetLikeStateDto {
  @IsBoolean()
  liked!: boolean;
}
