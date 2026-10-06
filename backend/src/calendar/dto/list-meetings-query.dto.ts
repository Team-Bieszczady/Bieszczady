import { IsDateString, Matches } from 'class-validator';

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
const DATE_MESSAGE = 'Data musi mieć format RRRR-MM-DD';

export class ListMeetingsQueryDto {
  @Matches(DATE_ONLY, { message: DATE_MESSAGE })
  @IsDateString({ strict: true }, { message: DATE_MESSAGE })
  from!: string;

  @Matches(DATE_ONLY, { message: DATE_MESSAGE })
  @IsDateString({ strict: true }, { message: DATE_MESSAGE })
  to!: string;
}
