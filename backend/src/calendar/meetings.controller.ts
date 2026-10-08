import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PasswordChangeGuard } from '../auth/guards/password-change.guard';
import { ModuleAccessGuard } from '../auth/guards/module-access.guard';
import { RequireModule } from '../auth/decorators/require-module.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { type AuthenticatedUser } from '../auth/types/auth.types';
import { MeetingsService } from './meetings.service';
import { ListMeetingsQueryDto } from './dto/list-meetings-query.dto';
import { CreateMeetingDto } from './dto/create-meeting.dto';

@Controller('meetings')
@UseGuards(JwtAuthGuard, PasswordChangeGuard, ModuleAccessGuard)
@RequireModule('CALENDAR')
export class MeetingsController {
  constructor(private readonly meetingsService: MeetingsService) {}

  @Get()
  findInRange(
    @Query() query: ListMeetingsQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.meetingsService.findInRange(query, user);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.meetingsService.findOne(id, user);
  }

  @Post()
  create(
    @Body() dto: CreateMeetingDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.meetingsService.create(dto, user);
  }
}
