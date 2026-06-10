import {
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export const REQUEST_TYPE_VALUES = [
  'project',
  'mentor',
  'internship',
  'message',
  'resume',
] as const;

export type RequestTypeValue = (typeof REQUEST_TYPE_VALUES)[number];

export class CreateRequestDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  toUserId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  toUsername?: string;

  @IsString()
  @IsIn(REQUEST_TYPE_VALUES)
  type!: RequestTypeValue;

  @IsOptional()
  @IsString()
  @MaxLength(140)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1200)
  message?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  relatedProjectId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  relatedThreadId?: string;
}
