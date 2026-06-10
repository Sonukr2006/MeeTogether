import { IsBoolean } from "class-validator";

export class SetProjectSaveStateDto {
  @IsBoolean()
  saved!: boolean;
}
