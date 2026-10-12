import { Module } from '@nestjs/common';
import { DocumentsModule } from '../documents/documents.module';
import { MailModule } from '../mail/mail.module';
import { ProjectsModule } from '../projects/projects.module';
import { UsersModule } from '../users/users.module';
import { DeadlinesController } from './deadlines.controller';
import { DeadlinesService } from './deadlines.service';
import { MeetingAttendanceController } from './meeting-attendance.controller';
import { MeetingAttendanceService } from './meeting-attendance.service';
import { MeetingParticipantsController } from './meeting-participants.controller';
import { MeetingParticipantsService } from './meeting-participants.service';
import { MeetingsController } from './meetings.controller';
import { MeetingsService } from './meetings.service';
import { ParticipantMeetingsController } from './participant-meetings.controller';

@Module({
  controllers: [
    MeetingsController,
    MeetingAttendanceController,
    MeetingParticipantsController,
    ParticipantMeetingsController,
    DeadlinesController,
  ],
  providers: [
    MeetingsService,
    MeetingAttendanceService,
    MeetingParticipantsService,
    DeadlinesService,
  ],
  imports: [UsersModule, ProjectsModule, DocumentsModule, MailModule],
})
export class CalendarModule {}
