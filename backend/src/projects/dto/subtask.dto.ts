import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { TrimmedString } from '../../common/decorators/trimmed-string.decorator';

export class CreateSubtaskDto {
  @TrimmedString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string;
}

export class UpdateSubtaskDto {
  @ValidateIf((_, value) => value !== undefined)
  @TrimmedString()
  @IsNotEmpty()
  @MaxLength(200)
  title?: string;

  @IsBoolean()
  @IsOptional()
  done?: boolean;
}
