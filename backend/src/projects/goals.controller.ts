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
import { DirectorGuard } from '../auth/guards/director.guard';
import { ModuleAccessGuard } from '../auth/guards/module-access.guard';
import { RequireModule } from '../auth/decorators/require-module.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { type AuthenticatedUser } from '../auth/types/auth.types';
import { GoalsService } from './goals.service';
import { CreateGoalDto, UpdateGoalDto } from './dto/goal.dto';

@ApiTags('projects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, ModuleAccessGuard)
@Controller()
export class GoalsController {
  constructor(private readonly goals: GoalsService) {}

  @RequireModule('PROJECTS')
  @Get('projects/:projectId/goals')
  @ApiOperation({
    summary: 'List the goals of a project',
    description:
      'Ordered by goalNumber, which is what the "CEL n" label shows.',
  })
  @ApiResponse({ status: 200, description: 'List of goals' })
  @ApiResponse({
    status: 404,
    description: 'Project not found, or the caller is not a member of it',
  })
  async list(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @CurrentUser() viewer: AuthenticatedUser,
  ) {
    return this.goals.findAllForProject(projectId, viewer);
  }

  @UseGuards(DirectorGuard)
  @RequireModule('PROJECTS')
  @Post('projects/:projectId/goals')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Add a goal',
    description:
      'goalNumber is assigned automatically, one past the current highest.',
  })
  @ApiBody({
    type: CreateGoalDto,
    examples: {
      example: {
        summary: 'New goal',
        value: {
          title: 'Bezpieczna, oznakowana trasa 22 km',
          description: 'Cała trasa oznakowana i bezpieczna dla użytkowników.',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Goal created' })
  @ApiResponse({ status: 403, description: 'Director only' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async create(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() dto: CreateGoalDto,
  ) {
    return this.goals.create(projectId, dto);
  }

  @UseGuards(DirectorGuard)
  @RequireModule('PROJECTS')
  @Patch('goals/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Edit a goal' })
  @ApiBody({ type: UpdateGoalDto })
  @ApiResponse({ status: 200, description: 'Goal updated' })
  @ApiResponse({ status: 403, description: 'Director only' })
  @ApiResponse({ status: 404, description: 'Goal not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateGoalDto,
  ) {
    return this.goals.update(id, dto);
  }

  @UseGuards(DirectorGuard)
  @RequireModule('PROJECTS')
  @Delete('goals/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a goal',
    description:
      'The remaining goals are renumbered, so the labels stay contiguous.',
  })
  @ApiResponse({ status: 204, description: 'Goal deleted (no content)' })
  @ApiResponse({ status: 403, description: 'Director only' })
  @ApiResponse({ status: 404, description: 'Goal not found' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.goals.remove(id);
  }
}
