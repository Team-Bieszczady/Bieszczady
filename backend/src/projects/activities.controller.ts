import {
  Body,
  Controller,
  Delete,
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
import { ActivitiesService } from './activities.service';
import {
  CreateActivityDto,
  MoveActivityDto,
  UpdateActivityDto,
} from './dto/activity.dto';

@ApiTags('projects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, ModuleAccessGuard)
@Controller()
export class ActivitiesController {
  constructor(private readonly activities: ActivitiesService) {}

  @UseGuards(DirectorGuard)
  @RequireModule('PROJECTS')
  @Post('stages/:stageId/activities')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create an activity in a stage',
    description:
      'Activities are listed by GET /projects/:projectId/stages, alongside their stage.',
  })
  @ApiBody({
    type: CreateActivityDto,
    examples: {
      example: {
        summary: 'New activity',
        value: { name: 'Montaż tablic i drogowskazów' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Activity created' })
  @ApiResponse({ status: 403, description: 'Director only' })
  @ApiResponse({ status: 404, description: 'Stage not found' })
  async create(
    @Param('stageId', ParseUUIDPipe) stageId: string,
    @Body() dto: CreateActivityDto,
  ) {
    return this.activities.create(stageId, dto);
  }

  @UseGuards(DirectorGuard)
  @RequireModule('PROJECTS')
  @Patch('activities/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rename an activity' })
  @ApiBody({ type: UpdateActivityDto })
  @ApiResponse({ status: 200, description: 'Activity updated' })
  @ApiResponse({ status: 403, description: 'Director only' })
  @ApiResponse({ status: 404, description: 'Activity not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateActivityDto,
  ) {
    return this.activities.update(id, dto);
  }

  @UseGuards(DirectorGuard)
  @RequireModule('PROJECTS')
  @Patch('activities/:id/stage')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Move an activity to another stage',
    description:
      'Its tasks travel with it, so both stages are re-evaluated: the one it left may now be complete, the one it joined may no longer be.',
  })
  @ApiBody({ type: MoveActivityDto })
  @ApiResponse({ status: 200, description: 'Activity moved' })
  @ApiResponse({ status: 403, description: 'Director only' })
  @ApiResponse({
    status: 404,
    description: 'Activity or target stage not found',
  })
  async move(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: MoveActivityDto,
  ) {
    return this.activities.move(id, dto);
  }

  @UseGuards(DirectorGuard)
  @RequireModule('PROJECTS')
  @Delete('activities/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete an activity',
    description:
      'Its tasks go with it. If they were the only unfinished work in the stage, the stage closes as a result.',
  })
  @ApiResponse({ status: 204, description: 'Activity deleted (no content)' })
  @ApiResponse({ status: 403, description: 'Director only' })
  @ApiResponse({ status: 404, description: 'Activity not found' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.activities.remove(id);
  }
}
