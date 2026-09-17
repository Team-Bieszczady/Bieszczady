import {
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsOptional,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import {
  STATUS_COLORS,
  type StatusColor,
} from '../../common/enums/project.enums';
import { TrimmedString } from '../../common/decorators/trimmed-string.decorator';

const NAME_MAX = 80;

export class CreateDictionaryEntryDto {
  @TrimmedString()
  @IsNotEmpty()
  @MaxLength(NAME_MAX)
  name!: string;
}

export class UpdateDictionaryEntryDto {
  @ValidateIf((_, value) => value !== undefined)
  @TrimmedString()
  @IsNotEmpty()
  @MaxLength(NAME_MAX)
  name?: string;

  @IsBoolean()
  @IsOptional()
  active?: boolean;
}

export class CreateStatusDto extends CreateDictionaryEntryDto {
  @IsIn(STATUS_COLORS)
  @IsOptional()
  color?: StatusColor;
}

export class UpdateStatusDto extends UpdateDictionaryEntryDto {
  @IsIn(STATUS_COLORS)
  @IsOptional()
  color?: StatusColor;
}
