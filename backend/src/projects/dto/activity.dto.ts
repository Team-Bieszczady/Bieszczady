import { IsNotEmpty, IsUUID, MaxLength, ValidateIf } from 'class-validator';
import { TrimmedString } from '../../common/decorators/trimmed-string.decorator';

export class CreateActivityDto {
  @TrimmedString()
  @IsNotEmpty()
  @MaxLength(200)
  name!: string;
}

export class UpdateActivityDto {
  @ValidateIf((_, value) => value !== undefined)
  @TrimmedString()
  @IsNotEmpty()
  @MaxLength(200)
  name?: string;
}

export class MoveActivityDto {
  @IsUUID()
  stageId!: string;
}
