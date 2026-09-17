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
import { ModuleAccessGuard } from '../auth/guards/module-access.guard';
import { RequireModule } from '../auth/decorators/require-module.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/auth.types';
import { TasksService } from './tasks.service';
import {
  CreateTaskDto,
  UpdateTaskDto,
  UpdateTaskStatusDto,
} from './dto/task.dto';
import { ListProjectsQueryDto } from './dto/update-project.dto';

@ApiTags('tasks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, ModuleAccessGuard)
@Controller()
export class TasksController {
  constructor(private readonly tasks: TasksService) {}

  @RequireModule('TASKS')
  @Get('projects/:projectId/tasks')
  @ApiOperation({
    summary: 'List every task in a project',
    description:
      'What a director or coordinator sees on Zadania. Tasks under archived stages are excluded unless ?archived=true, matching the stages read.',
  })
  @ApiQuery({ name: 'archived', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'List of tasks' })
  @ApiResponse({
    status: 404,
    description: 'Project not found, or the caller is not a member of it',
  })
  async list(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Query() query: ListProjectsQueryDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.tasks.findAllForProject(
      projectId,
      actor,
      query.archived ?? false,
    );
  }

  @RequireModule('TASKS')
  @Get('projects/:projectId/my-tasks')
  @ApiOperation({
    summary: "List the caller's own tasks in a project",
    description:
      'The same rows as /tasks, filtered to the signed-in user. "Mine" is literal — a director sees the tasks assigned to them, not all of them.',
  })
  @ApiQuery({ name: 'archived', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'List of the caller’s tasks' })
  @ApiResponse({
    status: 404,
    description: 'Project not found, or the caller is not a member of it',
  })
  async listMine(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Query() query: ListProjectsQueryDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.tasks.findMineForProject(
      projectId,
      actor,
      query.archived ?? false,
    );
  }

  @RequireModule('TASKS')
  @Get('tasks/:id')
  @ApiOperation({
    summary: 'One task, with its subtask checklist',
  })
  @ApiResponse({ status: 200, description: 'The task' })
  @ApiResponse({
    status: 404,
    description: 'Task not found, or the caller is not a member of its project',
  })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.tasks.findOne(id, actor);
  }

  @RequireModule('TASKS')
  @Post('activities/:activityId/tasks')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Add a task to an activity',
    description:
      'Hangs off the activity because that is the task’s real parent — tasks carry no project id. Adding a task can reopen a stage that had been complete.',
  })
  @ApiBody({
    type: CreateTaskDto,
    examples: {
      example: {
        summary: 'New task',
        value: {
          title: 'Zamówić tablice informacyjne',
          description: 'Sześć tablic na trasie, zgodnie z projektem.',
          priority: 'HIGH',
          dueDate: '2026-11-30',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Task created' })
  @ApiResponse({
    status: 403,
    description: 'Director or project coordinator only',
  })
  @ApiResponse({ status: 404, description: 'Activity not found' })
  @ApiResponse({
    status: 409,
    description: 'Owner is not a member of the project',
  })
  async create(
    @Param('activityId', ParseUUIDPipe) activityId: string,
    @Body() dto: CreateTaskDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.tasks.create(activityId, dto, actor);
  }

  @RequireModule('TASKS')
  @Patch('tasks/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Edit a task',
    description:
      'Everything except status, which has its own endpoint so an owner can tick a task without being able to retitle or reassign it. Sending activityId re-files the task; if the target sits under another stage, both stages are re-evaluated.',
  })
  @ApiBody({ type: UpdateTaskDto })
  @ApiResponse({ status: 200, description: 'Task updated' })
  @ApiResponse({
    status: 403,
    description: 'Director or project coordinator only',
  })
  @ApiResponse({
    status: 404,
    description: 'Task or target activity not found',
  })
  @ApiResponse({
    status: 409,
    description:
      'Owner is not a member, or the target activity is in another project',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTaskDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.tasks.update(id, dto, actor);
  }

  @RequireModule('TASKS')
  @Patch('tasks/:id/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Change a task’s status',
    description:
      'Allowed for the task owner as well as a director or the project coordinator. This is the only way a stage closes or reopens: completedAt is settled from tasks and nothing else.',
  })
  @ApiBody({
    type: UpdateTaskStatusDto,
    examples: {
      example: { summary: 'Tick it off', value: { status: 'DONE' } },
    },
  })
  @ApiResponse({ status: 200, description: 'Status changed' })
  @ApiResponse({
    status: 403,
    description: 'Not the owner, the project coordinator or a director',
  })
  @ApiResponse({ status: 404, description: 'Task not found' })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTaskStatusDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.tasks.updateStatus(id, dto, actor);
  }

  @RequireModule('TASKS')
  @Delete('tasks/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a task',
    description:
      'Its subtasks go with it. Deleting the last task of a stage reopens that stage, because an empty stage never counts as finished.',
  })
  @ApiResponse({ status: 204, description: 'Task deleted (no content)' })
  @ApiResponse({
    status: 403,
    description: 'Director or project coordinator only',
  })
  @ApiResponse({ status: 404, description: 'Task not found' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    await this.tasks.remove(id, actor);
  }
}
