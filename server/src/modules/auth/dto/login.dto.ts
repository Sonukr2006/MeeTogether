import { IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  identifier!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(128)
  password!: string;
}
