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
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ModuleAccessGuard } from '../auth/guards/module-access.guard';
import { RequireModule } from '../auth/decorators/require-module.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/auth.types';
import { SubtasksService } from './subtasks.service';
import { CreateSubtaskDto, UpdateSubtaskDto } from './dto/subtask.dto';

@ApiTags('tasks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, ModuleAccessGuard)
@Controller()
export class SubtasksController {
  constructor(private readonly subtasks: SubtasksService) {}

  @RequireModule('TASKS')
  @Get('tasks/:taskId/subtasks')
  @ApiOperation({
    summary: 'List a task’s subtasks',
    description:
      'Readable by anyone who can read the task; they also arrive inline on GET /tasks/:id.',
  })
  @ApiResponse({ status: 200, description: 'List of subtasks' })
  @ApiResponse({
    status: 404,
    description: 'Task not found, or the caller is not a member of its project',
  })
  async list(
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.subtasks.findAllForTask(taskId, actor);
  }

  @RequireModule('TASKS')
  @Post('tasks/:taskId/subtasks')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Add a subtask',
    description:
      'Owner only — a director who does not own the task gets a 403. Subtasks never affect the task’s status or its stage’s completion; they only drive the progress bar.',
  })
  @ApiBody({
    type: CreateSubtaskDto,
    examples: {
      example: {
        summary: 'New checklist item',
        value: { title: 'Zebrać oferty od trzech dostawców' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Subtask created' })
  @ApiResponse({ status: 403, description: 'Task owner only' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  async create(
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Body() dto: CreateSubtaskDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.subtasks.create(taskId, dto, actor);
  }

  @RequireModule('TASKS')
  @Patch('subtasks/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Rename or tick a subtask',
    description:
      'One call for both: send { done: true } to tick, { title } to rename. Owner only.',
  })
  @ApiBody({
    type: UpdateSubtaskDto,
    examples: { tick: { summary: 'Tick it', value: { done: true } } },
  })
  @ApiResponse({ status: 200, description: 'Subtask updated' })
  @ApiResponse({ status: 403, description: 'Task owner only' })
  @ApiResponse({ status: 404, description: 'Subtask not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSubtaskDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.subtasks.update(id, dto, actor);
  }

  @RequireModule('TASKS')
  @Delete('subtasks/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a subtask', description: 'Owner only.' })
  @ApiResponse({ status: 204, description: 'Subtask deleted (no content)' })
  @ApiResponse({ status: 403, description: 'Task owner only' })
  @ApiResponse({ status: 404, description: 'Subtask not found' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    await this.subtasks.remove(id, actor);
  }
}
