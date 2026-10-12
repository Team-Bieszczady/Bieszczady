import {
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  MaxLength,
} from 'class-validator';
import {
  EVENT_SOURCES,
  type EventSource,
} from '../../common/enums/project.enums';
import { TrimmedString } from '../../common/decorators/trimmed-string.decorator';

export class CreateManualEventDto {
  @IsUUID()
  projectId!: string;

  @TrimmedString()
  @IsNotEmpty()
  @MaxLength(2000)
  content!: string;
}

export class ListEventsQueryDto {
  @IsUUID()
  @IsOptional()
  projectId?: string;

  @IsIn(EVENT_SOURCES)
  @IsOptional()
  source?: EventSource;

  @IsDateString()
  @IsOptional()
  from?: string;

  @IsUUID()
  @IsOptional()
  cursor?: string;
}
