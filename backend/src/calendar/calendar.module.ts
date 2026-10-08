import { Module } from '@nestjs/common';
import { DocumentsModule } from '../documents/documents.module';
import { ProjectsModule } from '../projects/projects.module';
import { UsersModule } from '../users/users.module';
import { MeetingAttendanceController } from './meeting-attendance.controller';
import { MeetingAttendanceService } from './meeting-attendance.service';
import { MeetingsController } from './meetings.controller';
import { MeetingsService } from './meetings.service';

@Module({
  controllers: [MeetingsController, MeetingAttendanceController],
  providers: [MeetingsService, MeetingAttendanceService],
  imports: [UsersModule, ProjectsModule, DocumentsModule],
})
export class CalendarModule {}
