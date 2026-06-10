import { IsString, Matches } from 'class-validator';

export class VerifyEmailDto {
  @IsString()
  @Matches(/^[a-f0-9]{64}$/)
  token!: string;
}
