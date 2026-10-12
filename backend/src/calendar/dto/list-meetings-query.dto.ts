import { IsDateString, Matches } from 'class-validator';
import { DATE_MESSAGE, DATE_ONLY } from './formats';

export class ListMeetingsQueryDto {
  @Matches(DATE_ONLY, { message: DATE_MESSAGE })
  @IsDateString({ strict: true }, { message: DATE_MESSAGE })
  from!: string;

  @Matches(DATE_ONLY, { message: DATE_MESSAGE })
  @IsDateString({ strict: true }, { message: DATE_MESSAGE })
  to!: string;
}
