import { Type } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsUUID,
  MaxLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import {
  PROJECT_COLORS,
  PROJECT_ROLES,
  type ProjectColor,
  type ProjectRoleValue,
} from '../../common/enums/project.enums';
import { TrimmedString } from '../../common/decorators/trimmed-string.decorator';

export class ProjectMemberInputDto {
  @IsUUID()
  userId!: string;

  @IsIn(PROJECT_ROLES)
  projectRole!: ProjectRoleValue;
}

export class CreateProjectDto {
  @TrimmedString()
  @IsNotEmpty()
  @MaxLength(200)
  name!: string;

  @ValidateIf((_, value) => value !== undefined)
  @TrimmedString()
  @MaxLength(2000)
  description?: string;

  @IsUUID()
  @IsOptional()
  statusId?: string;

  @IsIn(PROJECT_COLORS)
  @IsOptional()
  color?: ProjectColor;

  @IsNumberString({ no_symbols: false })
  @IsOptional()
  budgetAmount?: string;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  plannedEndDate?: string;

  @IsArray()
  @IsOptional()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  typeIds?: string[];

  @IsArray()
  @IsOptional()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  recipientIds?: string[];

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ProjectMemberInputDto)
  members?: ProjectMemberInputDto[];
}
