import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { MeetingsController } from './meetings.controller';
import { MeetingsService } from './meetings.service';

@Module({
  controllers: [MeetingsController],
  providers: [MeetingsService],
  imports: [UsersModule],
})
export class CalendarModule {}
