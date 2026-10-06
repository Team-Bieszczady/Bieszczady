import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import {
  INDICATOR_SCOPES,
  type IndicatorScope,
} from '../../common/enums/project.enums';
import { TrimmedString } from '../../common/decorators/trimmed-string.decorator';

const MAX_VALUE = 1_000_000;

export class CreateIndicatorDto {
  @TrimmedString()
  @IsNotEmpty()
  @MaxLength(200)
  name!: string;

  @ValidateIf((_, value) => value !== undefined)
  @TrimmedString()
  @MaxLength(2000)
  description?: string;

  @IsInt()
  @Min(1)
  @Max(MAX_VALUE)
  targetValue!: number;

  @IsInt()
  @Min(0)
  @Max(MAX_VALUE)
  @IsOptional()
  currentValue?: number;

  @IsIn(INDICATOR_SCOPES)
  scope!: IndicatorScope;

  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsUUID()
  @IsOptional()
  stageId?: string | null;

  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsUUID()
  @IsOptional()
  taskId?: string | null;

  @IsArray()
  @ArrayMaxSize(50)
  @IsUUID('all', { each: true })
  @IsOptional()
  folderIds?: string[];

  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsUUID()
  @IsOptional()
  ownerId?: string | null;
}

export class UpdateIndicatorDto {
  @ValidateIf((_, value) => value !== undefined)
  @TrimmedString()
  @IsNotEmpty()
  @MaxLength(200)
  name?: string;

  @ValidateIf((_, value) => value !== undefined)
  @TrimmedString()
  @MaxLength(2000)
  description?: string;

  @IsInt()
  @Min(1)
  @Max(MAX_VALUE)
  @IsOptional()
  targetValue?: number;

  @IsInt()
  @Min(0)
  @Max(MAX_VALUE)
  @IsOptional()
  currentValue?: number;

  @IsIn(INDICATOR_SCOPES)
  @IsOptional()
  scope?: IndicatorScope;

  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsUUID()
  @IsOptional()
  stageId?: string | null;

  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsUUID()
  @IsOptional()
  taskId?: string | null;

  @IsArray()
  @ArrayMaxSize(50)
  @IsUUID('all', { each: true })
  @IsOptional()
  folderIds?: string[];

  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsUUID()
  @IsOptional()
  ownerId?: string | null;
}

export class IndicatorProgressDto {
  @IsIn([-1, 1])
  @IsOptional()
  delta?: -1 | 1;

  @IsInt()
  @Min(0)
  @Max(MAX_VALUE)
  @IsOptional()
  value?: number;
}
