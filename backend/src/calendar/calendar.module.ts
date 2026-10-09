import { Module } from '@nestjs/common';
import { DocumentsModule } from '../documents/documents.module';
import { MailModule } from '../mail/mail.module';
import { ProjectsModule } from '../projects/projects.module';
import { UsersModule } from '../users/users.module';
import { DeadlinesController } from './deadlines.controller';
import { DeadlinesService } from './deadlines.service';
import { MeetingAttendanceController } from './meeting-attendance.controller';
import { MeetingAttendanceService } from './meeting-attendance.service';
import { MeetingsController } from './meetings.controller';
import { MeetingsService } from './meetings.service';

@Module({
  controllers: [
    MeetingsController,
    MeetingAttendanceController,
    DeadlinesController,
  ],
  providers: [MeetingsService, MeetingAttendanceService, DeadlinesService],
  imports: [UsersModule, ProjectsModule, DocumentsModule, MailModule],
})
export class CalendarModule {}
