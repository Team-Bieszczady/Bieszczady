import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequireModule } from '../auth/decorators/require-module.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ModuleAccessGuard } from '../auth/guards/module-access.guard';
import { PasswordChangeGuard } from '../auth/guards/password-change.guard';
import { type AuthenticatedUser } from '../auth/types/auth.types';
import { AddMeetingParticipantDto } from './dto/add-meeting-participant.dto';
import { MeetingParticipantsService } from './meeting-participants.service';

@Controller('meetings/:meetingId/participants')
@UseGuards(JwtAuthGuard, PasswordChangeGuard, ModuleAccessGuard)
@RequireModule('PARTICIPANTS')
export class MeetingParticipantsController {
  constructor(
    private readonly meetingParticipants: MeetingParticipantsService,
  ) {}

  @Get()
  list(
    @Param('meetingId', ParseUUIDPipe) meetingId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.meetingParticipants.list(meetingId, user);
  }

  @Post()
  @HttpCode(HttpStatus.NO_CONTENT)
  add(
    @Param('meetingId', ParseUUIDPipe) meetingId: string,
    @Body() dto: AddMeetingParticipantDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.meetingParticipants.add(meetingId, dto.participantId, user);
  }

  @Delete(':participantId')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('meetingId', ParseUUIDPipe) meetingId: string,
    @Param('participantId', ParseUUIDPipe) participantId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.meetingParticipants.remove(meetingId, participantId, user);
  }
}
