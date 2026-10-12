import { OmitType } from '@nestjs/swagger';
import { CreateMeetingDto } from './create-meeting.dto';

export class UpdateMeetingDto extends OmitType(CreateMeetingDto, [
  'projectId',
] as const) {}
