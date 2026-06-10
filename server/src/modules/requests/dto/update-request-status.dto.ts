import { IsIn } from 'class-validator';

export const REQUEST_STATUS_VALUES = ['Accepted', 'Declined', 'Replying'] as const;

export type RequestStatusValue = (typeof REQUEST_STATUS_VALUES)[number];

export class UpdateRequestStatusDto {
  @IsIn(REQUEST_STATUS_VALUES)
  status!: RequestStatusValue;
}
