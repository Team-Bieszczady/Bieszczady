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
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DirectorGuard } from '../auth/guards/director.guard';
import { ModuleAccessGuard } from '../auth/guards/module-access.guard';
import { RequireModule } from '../auth/decorators/require-module.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { type AuthenticatedUser } from '../auth/types/auth.types';
import { StagesService } from './stages.service';
import { ListProjectsQueryDto } from './dto/update-project.dto';
import {
  ApplyStageShiftsDto,
  CreateStageDto,
  DeleteStageQueryDto,
  MoveStageDeadlineDto,
  UpdateStageDto,
} from './dto/stage.dto';

@ApiTags('projects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, ModuleAccessGuard)
@Controller()
export class StagesController {
  constructor(private readonly stages: StagesService) {}

  @RequireModule('PROJECTS')
  @Get('projects/:projectId/stages')
  @ApiOperation({
    summary: 'List the stages of a project',
    description:
      'In timeline order, each with its activities and task counts. `counts` is what the progress bar reads and the evidence behind `completedAt`.',
  })
  @ApiQuery({
    name: 'archived',
    required: false,
    type: Boolean,
    description: 'Include archived stages.',
  })
  @ApiResponse({ status: 200, description: 'List of stages' })
  @ApiResponse({
    status: 404,
    description: 'Project not found, or the caller is not a member of it',
  })
  async list(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Query() query: ListProjectsQueryDto,
    @CurrentUser() viewer: AuthenticatedUser,
  ) {
    return this.stages.findAllForProject(projectId, !!query.archived, viewer);
  }

  @UseGuards(DirectorGuard)
  @RequireModule('PROJECTS')
  @Post('projects/:projectId/stages')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a stage',
    description:
      'A new stage is born empty, so it can never be complete: completion needs at least one finished task.',
  })
  @ApiBody({
    type: CreateStageDto,
    examples: {
      example: {
        summary: 'New stage',
        value: {
          name: 'Odbiór końcowy',
          description: 'Komisyjny odbiór całej trasy.',
          startDate: '2026-10-01',
          deadline: '2026-10-20',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Stage created' })
  @ApiResponse({ status: 403, description: 'Director only' })
  @ApiResponse({ status: 409, description: 'Deadline precedes the start date' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async create(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() dto: CreateStageDto,
  ) {
    return this.stages.create(projectId, dto);
  }

  @UseGuards(DirectorGuard)
  @RequireModule('PROJECTS')
  @Patch('stages/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Edit a stage',
    description:
      'Name and description only. Dates move through PATCH /stages/:id/deadline, which is what records the original date and the reason.',
  })
  @ApiBody({ type: UpdateStageDto })
  @ApiResponse({ status: 200, description: 'Stage updated' })
  @ApiResponse({ status: 403, description: 'Director only' })
  @ApiResponse({ status: 404, description: 'Stage not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateStageDto,
  ) {
    return this.stages.update(id, dto);
  }

  @UseGuards(DirectorGuard)
  @RequireModule('PROJECTS')
  @Patch('stages/:id/deadline')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Move a stage deadline',
    description:
      'Writes `originalDeadline` on the first move only and rewrites `deadlineNote` every time. Returns the stages that now clash as `suggestions` — it changes none of them.',
  })
  @ApiBody({
    type: MoveStageDeadlineDto,
    examples: {
      example: {
        summary: 'Push by two months',
        value: {
          deadline: '2026-10-31',
          note: 'Dostawca tablic przesunął termin produkcji o dwa miesiące.',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Deadline moved, suggestions returned',
  })
  @ApiResponse({ status: 403, description: 'Director only' })
  @ApiResponse({
    status: 409,
    description: 'Deadline precedes the start or completion date',
  })
  @ApiResponse({ status: 404, description: 'Stage not found' })
  async moveDeadline(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: MoveStageDeadlineDto,
  ) {
    return this.stages.moveDeadline(id, dto);
  }

  @UseGuards(DirectorGuard)
  @RequireModule('PROJECTS')
  @Post('stages/cascade')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Apply accepted stage shifts',
    description:
      'Moves the following stages the caller agreed to shift. Each records its own trace.',
  })
  @ApiBody({ type: ApplyStageShiftsDto })
  @ApiResponse({ status: 200, description: 'Stages shifted' })
  @ApiResponse({ status: 403, description: 'Director only' })
  @ApiResponse({ status: 404, description: 'One or more stages not found' })
  async shiftFollowing(@Body() dto: ApplyStageShiftsDto) {
    return this.stages.applyFollowingStageShifts(dto);
  }

  @UseGuards(DirectorGuard)
  @RequireModule('PROJECTS')
  @Patch('stages/:id/archive')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Archive a stage',
    description:
      'Removes it from the timeline while keeping its activities and tasks. The way out for a stage nobody will ever work.',
  })
  @ApiResponse({ status: 200, description: 'Stage archived' })
  @ApiResponse({ status: 403, description: 'Director only' })
  @ApiResponse({ status: 404, description: 'Stage not found' })
  async archive(@Param('id', ParseUUIDPipe) id: string) {
    return this.stages.setArchived(id, true);
  }

  @UseGuards(DirectorGuard)
  @RequireModule('PROJECTS')
  @Patch('stages/:id/restore')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Restore an archived stage' })
  @ApiResponse({ status: 200, description: 'Stage restored' })
  @ApiResponse({ status: 403, description: 'Director only' })
  @ApiResponse({ status: 404, description: 'Stage not found' })
  async restore(@Param('id', ParseUUIDPipe) id: string) {
    return this.stages.setArchived(id, false);
  }

  @UseGuards(DirectorGuard)
  @RequireModule('PROJECTS')
  @Delete('stages/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a stage',
    description:
      'A stage holding activities needs a strategy: `move` relocates them (with their tasks) to `targetStageId`, `delete` destroys them. `none` only succeeds on an empty stage.',
  })
  @ApiQuery({
    name: 'strategy',
    required: false,
    enum: ['none', 'move', 'delete'],
  })
  @ApiQuery({ name: 'targetStageId', required: false, type: String })
  @ApiResponse({ status: 204, description: 'Stage deleted (no content)' })
  @ApiResponse({ status: 403, description: 'Director only' })
  @ApiResponse({
    status: 409,
    description: 'Stage has activities and no strategy was given',
  })
  @ApiResponse({ status: 404, description: 'Stage or target stage not found' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: DeleteStageQueryDto,
  ) {
    await this.stages.remove(id, query);
  }
}
