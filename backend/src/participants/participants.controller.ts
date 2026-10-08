import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PasswordChangeGuard } from '../auth/guards/password-change.guard';
import { ModuleAccessGuard } from '../auth/guards/module-access.guard';
import { RequireModule } from '../auth/decorators/require-module.decorator';
import { ParticipantsService } from './participants.service';
import { ListParticipantsQueryDto } from './dto/list-participants-query.dto';

@Controller('participants')
@UseGuards(JwtAuthGuard, PasswordChangeGuard, ModuleAccessGuard)
@RequireModule('PARTICIPANTS')
export class ParticipantsController {
  constructor(private readonly participantsService: ParticipantsService) {}

  @Get()
  findAll(@Query() query: ListParticipantsQueryDto) {
    return this.participantsService.findAll(query);
  }
}
