import { IsOptional, IsUUID, MaxLength } from 'class-validator';
import { TrimmedString } from '../../common/decorators/trimmed-string.decorator';
import { NAME_MAX_LENGTH } from '../../common/validation/name';

export class DuplicateParticipantsQueryDto {
  @IsOptional()
  @TrimmedString()
  @MaxLength(NAME_MAX_LENGTH)
  firstName?: string;

  @IsOptional()
  @TrimmedString()
  @MaxLength(NAME_MAX_LENGTH)
  lastName?: string;

  @IsOptional()
  @TrimmedString()
  @MaxLength(200)
  email?: string;

  @IsOptional()
  @IsUUID()
  excludeId?: string;
}
