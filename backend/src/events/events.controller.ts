import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ModuleAccessGuard } from '../auth/guards/module-access.guard';
import { RequireModule } from '../auth/decorators/require-module.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/auth.types';
import { EventsService } from './events.service';
import { CreateManualEventDto, ListEventsQueryDto } from './dto/event.dto';

@ApiTags('events')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, ModuleAccessGuard)
@Controller('events')
export class EventsController {
  constructor(private readonly events: EventsService) {}

  @RequireModule('DECISIONS')
  @Get()
  @ApiOperation({
    summary: 'List project events',
    description:
      'Activity and decision history, newest first. A director sees every project; anyone else only the projects they are a member of. Cursor-paginated.',
  })
  @ApiQuery({ name: 'projectId', required: false, type: String })
  @ApiQuery({ name: 'source', required: false, enum: ['AUTOMATIC', 'MANUAL'] })
  @ApiQuery({
    name: 'from',
    required: false,
    type: String,
    description: 'ISO date; only events at or after it.',
  })
  @ApiQuery({ name: 'cursor', required: false, type: String })
  @ApiResponse({ status: 200, description: '{ items, nextCursor }' })
  async findAll(
    @Query() query: ListEventsQueryDto,
    @CurrentUser() viewer: AuthenticatedUser,
  ) {
    return this.events.findAll(query, viewer);
  }

  @RequireModule('DECISIONS')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Add a decision by hand',
    description:
      'Records a decision the app cannot observe on its own. The author is taken from the token and the source is always MANUAL.',
  })
  @ApiResponse({ status: 201, description: 'Event created' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 403, description: 'Project is archived' })
  @ApiResponse({
    status: 404,
    description: 'Project not found, or not a member',
  })
  async create(
    @Body() dto: CreateManualEventDto,
    @CurrentUser() viewer: AuthenticatedUser,
  ) {
    return this.events.create(dto, viewer);
  }
}
