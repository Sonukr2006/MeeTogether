import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export const REQUEST_UNREAD_QUERY_VALUES = ['true', 'false'] as const;

export type RequestUnreadQueryValue = (typeof REQUEST_UNREAD_QUERY_VALUES)[number];

export class ListRequestsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;

  @IsOptional()
  @IsString()
  cursor?: string;

  @IsOptional()
  @IsString()
  @IsIn(REQUEST_UNREAD_QUERY_VALUES)
  unread?: RequestUnreadQueryValue;
}
