import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

export const MEETING_OUTCOMES = ['HELD', 'CANCELLED'] as const;
export type MeetingOutcome = (typeof MEETING_OUTCOMES)[number];

export class MeetingOutcomeDto {
  @IsIn(MEETING_OUTCOMES)
  status!: MeetingOutcome;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100000)
  attendeeCount?: number;
}
