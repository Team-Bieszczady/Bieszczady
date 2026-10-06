import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PasswordChangeGuard } from '../auth/guards/password-change.guard';
import { ModuleAccessGuard } from '../auth/guards/module-access.guard';
import { RequireModule } from '../auth/decorators/require-module.decorator';
import { MeetingsService } from './meetings.service';
import { ListMeetingsQueryDto } from './dto/list-meetings-query.dto';

@Controller('meetings')
@UseGuards(JwtAuthGuard, PasswordChangeGuard, ModuleAccessGuard)
@RequireModule('CALENDAR')
export class MeetingsController {
  constructor(private readonly meetingsService: MeetingsService) {}

  @Get()
  findInRange(@Query() query: ListMeetingsQueryDto) {
    return this.meetingsService.findInRange(query);
  }
}
