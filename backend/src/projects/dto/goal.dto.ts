import { IsNotEmpty, MaxLength, ValidateIf } from 'class-validator';
import { TrimmedString } from '../../common/decorators/trimmed-string.decorator';

export class CreateGoalDto {
  @TrimmedString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string;

  @ValidateIf((_, value) => value !== undefined)
  @TrimmedString()
  @MaxLength(2000)
  description?: string;
}

export class UpdateGoalDto {
  @ValidateIf((_, value) => value !== undefined)
  @TrimmedString()
  @IsNotEmpty()
  @MaxLength(200)
  title?: string;

  @ValidateIf((_, value) => value !== undefined)
  @TrimmedString()
  @IsNotEmpty()
  @MaxLength(2000)
  description?: string;
}
