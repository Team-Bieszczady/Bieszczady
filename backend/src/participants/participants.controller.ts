import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
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
import { ParticipantsService } from './participants.service';
import { DuplicateParticipantsQueryDto } from './dto/duplicate-participants-query.dto';
import { ListParticipantsQueryDto } from './dto/list-participants-query.dto';
import {
  CreateParticipantDto,
  UpdateParticipantDto,
} from './dto/participant.dto';

@Controller('participants')
@UseGuards(JwtAuthGuard, PasswordChangeGuard, ModuleAccessGuard)
@RequireModule('PARTICIPANTS')
export class ParticipantsController {
  constructor(private readonly participantsService: ParticipantsService) {}

  @Get()
  findAll(@Query() query: ListParticipantsQueryDto) {
    return this.participantsService.findAll(query);
  }

  @Get('duplicates')
  findDuplicates(@Query() query: DuplicateParticipantsQueryDto) {
    return this.participantsService.findDuplicates(query);
  }

  @Post()
  create(
    @Body() dto: CreateParticipantDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.participantsService.create(dto, user.id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateParticipantDto,
  ) {
    return this.participantsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.participantsService.remove(id);
  }
}
