import {
  ArrayUnique,
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsUrl,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';
import { TrimmedString } from '../../common/decorators/trimmed-string.decorator';
import { DATE_MESSAGE, DATE_ONLY, TIME_MESSAGE, TIME_ONLY } from './formats';

export class CreateMeetingDto {
  @IsUUID()
  projectId!: string;

  @TrimmedString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string;

  @Matches(DATE_ONLY, { message: DATE_MESSAGE })
  @IsDateString({ strict: true }, { message: DATE_MESSAGE })
  date!: string;

  @Matches(TIME_ONLY, { message: TIME_MESSAGE })
  startTime!: string;

  @Matches(TIME_ONLY, { message: TIME_MESSAGE })
  endTime!: string;

  @IsOptional()
  @TrimmedString()
  @MaxLength(200)
  place?: string;

  @IsOptional()
  @IsUrl(
    { require_protocol: true },
    { message: 'Link musi zaczynać się od http:// albo https://' },
  )
  @MaxLength(1000)
  meetingUrl?: string;

  @IsOptional()
  @TrimmedString()
  @MaxLength(2000)
  note?: string;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsUUID('all', { each: true })
  inviteeIds?: string[];
}
