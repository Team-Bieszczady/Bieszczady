import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequireModule } from '../auth/decorators/require-module.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ModuleAccessGuard } from '../auth/guards/module-access.guard';
import { PasswordChangeGuard } from '../auth/guards/password-change.guard';
import { type AuthenticatedUser } from '../auth/types/auth.types';
import { MeetingParticipantsService } from './meeting-participants.service';

@Controller('participants/:participantId/meetings')
@UseGuards(JwtAuthGuard, PasswordChangeGuard, ModuleAccessGuard)
@RequireModule('PARTICIPANTS')
export class ParticipantMeetingsController {
  constructor(
    private readonly meetingParticipants: MeetingParticipantsService,
  ) {}

  @Get()
  history(
    @Param('participantId', ParseUUIDPipe) participantId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.meetingParticipants.history(participantId, user);
  }
}
