import { IsUrl } from 'class-validator';

export class UpdateAvatarDto {
  @IsUrl({ require_tld: false }, { message: 'Avatar URL must be valid' })
  avatar!: string;
}
