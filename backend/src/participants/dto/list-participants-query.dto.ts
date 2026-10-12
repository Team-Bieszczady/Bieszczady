import { IsOptional, MaxLength } from 'class-validator';
import { TrimmedString } from '../../common/decorators/trimmed-string.decorator';

export class ListParticipantsQueryDto {
  @IsOptional()
  @TrimmedString()
  @MaxLength(100)
  search?: string;
}
