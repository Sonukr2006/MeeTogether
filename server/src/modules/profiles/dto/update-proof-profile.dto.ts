import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from "class-validator";

class ProofLinkDto {
  @IsString()
  @MaxLength(40)
  label!: string;

  @IsString()
  @MaxLength(240)
  value!: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  iconKey?: string;
}

class ProofSkillDto {
  @IsString()
  @MaxLength(60)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  evidence?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  level?: number;
}

class ProofTrustSignalDto {
  @IsString()
  @MaxLength(60)
  label!: string;

  @IsString()
  @MaxLength(180)
  detail!: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  iconKey?: string;
}

export class UpdateProofProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  headline?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  summary?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(8)
  @ValidateNested({ each: true })
  @Type(() => ProofLinkDto)
  links?: ProofLinkDto[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(12)
  @ValidateNested({ each: true })
  @Type(() => ProofSkillDto)
  skills?: ProofSkillDto[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(8)
  @ValidateNested({ each: true })
  @Type(() => ProofTrustSignalDto)
  trustSignals?: ProofTrustSignalDto[];
}
