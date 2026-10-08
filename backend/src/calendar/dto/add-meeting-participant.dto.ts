import { IsUUID } from 'class-validator';

export class AddMeetingParticipantDto {
  @IsUUID()
  participantId!: string;
}
