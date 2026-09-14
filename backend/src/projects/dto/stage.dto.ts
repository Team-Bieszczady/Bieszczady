import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  MaxLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import {
  STAGE_DELETE_STRATEGIES,
  type StageDeleteStrategy,
} from '../../common/enums/project.enums';
import { TrimmedString } from '../../common/decorators/trimmed-string.decorator';

export class CreateStageDto {
  @TrimmedString()
  @IsNotEmpty()
  @MaxLength(200)
  name!: string;

  @ValidateIf((_, value) => value !== undefined)
  @TrimmedString()
  @MaxLength(2000)
  description?: string;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  deadline!: string;
}

export class UpdateStageDto {
  @ValidateIf((_, value) => value !== undefined)
  @TrimmedString()
  @IsNotEmpty()
  @MaxLength(200)
  name?: string;

  @ValidateIf((_, value) => value !== undefined)
  @TrimmedString()
  @MaxLength(2000)
  description?: string;
}

export class MoveStageDeadlineDto {
  @IsDateString()
  deadline!: string;

  @ValidateIf((_, value) => value !== undefined)
  @TrimmedString()
  @MaxLength(2000)
  note?: string;
}

export class StageShiftDto {
  @IsUUID()
  stageId!: string;

  @IsDateString()
  deadline!: string;
}

export class ApplyStageShiftsDto {
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => StageShiftDto)
  shifts!: StageShiftDto[];

  @ValidateIf((_, value) => value !== undefined)
  @TrimmedString()
  @MaxLength(2000)
  note?: string;
}

export class DeleteStageQueryDto {
  @IsIn(STAGE_DELETE_STRATEGIES)
  @IsOptional()
  strategy?: StageDeleteStrategy;

  @ValidateIf((dto: DeleteStageQueryDto) => dto.strategy === 'move')
  @IsUUID()
  targetStageId?: string;
}
