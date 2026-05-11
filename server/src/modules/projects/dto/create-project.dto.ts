import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateProjectDto {
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  title!: string;

  @IsString()
  @MinLength(80)
  @MaxLength(3000)
  problemStatement!: string;

  @IsString()
  @MinLength(80)
  @MaxLength(3000)
  solutionApproach!: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(12)
  @IsString({ each: true })
  @MaxLength(40, { each: true })
  techStack?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(80)
  difficulty?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  timeline?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  mentorStatus?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  @MaxLength(60, { each: true })
  openRoles?: string[];

  @IsOptional()
  @IsUrl({ require_tld: false }, { message: 'GitHub URL must be valid' })
  githubUrl?: string;

  @IsOptional()
  @IsUrl({ require_tld: false }, { message: 'Demo URL must be valid' })
  demoUrl?: string;

  @IsOptional()
  @IsUrl({ require_tld: false }, { message: 'Project image URL must be valid' })
  imageUrl?: string;

  @IsOptional()
  @IsString()
  @IsIn(['public'])
  visibility?: string;
}
