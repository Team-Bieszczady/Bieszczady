import { Transform } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import {
  PROJECT_COLORS,
  type ProjectColor,
} from '../../common/enums/project.enums';
import { TrimmedString } from '../../common/decorators/trimmed-string.decorator';

export class UpdateProjectDto {
  @ValidateIf((_, value) => value !== undefined)
  @TrimmedString()
  @IsNotEmpty()
  @MaxLength(200)
  name?: string;

  @ValidateIf((_, value) => value !== undefined)
  @TrimmedString()
  @IsNotEmpty()
  @MaxLength(2000)
  description?: string;

  @IsIn(PROJECT_COLORS)
  @IsOptional()
  color?: ProjectColor;

  @ValidateIf((_, value) => value !== null)
  @IsDateString()
  @IsOptional()
  startDate?: string | null;

  @ValidateIf((_, value) => value !== null)
  @IsDateString()
  @IsOptional()
  plannedEndDate?: string | null;
}

export class UpdateProjectStatusDto {
  @ValidateIf((_, value) => value !== null)
  @IsUUID()
  statusId!: string | null;
}

export class UpdateProjectTypesDto {
  @IsArray()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  typeIds!: string[];
}

export class UpdateProjectRecipientsDto {
  @IsArray()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  recipientIds!: string[];
}

export class ListProjectsQueryDto {
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  archived?: boolean;
}
