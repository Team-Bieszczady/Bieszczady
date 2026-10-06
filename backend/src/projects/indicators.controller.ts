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
import { type AuthenticatedUser } from '../auth/types/auth.types';
import { IndicatorsService } from './indicators.service';
import {
  CreateIndicatorDto,
  IndicatorProgressDto,
  UpdateIndicatorDto,
} from './dto/indicator.dto';

@ApiTags('projects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, ModuleAccessGuard)
@Controller()
export class IndicatorsController {
  constructor(private readonly indicators: IndicatorsService) {}

  @RequireModule('PROJECTS')
  @Get('projects/:projectId/indicators')
  @ApiOperation({
    summary: 'List the indicators of a project',
    description:
      'Each carries its computed percent and deadline. The deadline is derived from the assigned stage or task, or from the project end, and is never stored. `folders` is filled only for a director, the project coordinator, or a user with the DOCUMENTS module; everyone else gets an empty list.',
  })
  @ApiResponse({ status: 200, description: 'List of indicators' })
  @ApiResponse({
    status: 404,
    description: 'Project not found, or the caller is not a member of it',
  })
  async list(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @CurrentUser() viewer: AuthenticatedUser,
  ) {
    return this.indicators.findAllForProject(projectId, viewer);
  }

  @RequireModule('PROJECTS')
  @Post('projects/:projectId/indicators')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Add an indicator',
    description:
      'A director or the coordinator of the project. With scope STAGE exactly one of stageId / taskId is required, and it must belong to this project; the folders must be live folders of this project.',
  })
  @ApiBody({
    type: CreateIndicatorDto,
    examples: {
      example: {
        summary: 'Workshops held',
        value: {
          name: 'Liczba przeprowadzonych warsztatów',
          targetValue: 5,
          scope: 'STAGE',
          stageId: '00000000-0000-0000-0000-000000000000',
          folderIds: [],
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Indicator created' })
  @ApiResponse({ status: 400, description: 'Invalid payload' })
  @ApiResponse({
    status: 403,
    description: 'Not a director or coordinator, or the project is archived',
  })
  @ApiResponse({
    status: 409,
    description:
      'Stage, task or folder outside this project; owner not a member; current value above target',
  })
  async create(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() dto: CreateIndicatorDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.indicators.create(projectId, dto, actor);
  }

  @RequireModule('PROJECTS')
  @Patch('indicators/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Edit an indicator' })
  @ApiBody({ type: UpdateIndicatorDto })
  @ApiResponse({ status: 200, description: 'Indicator updated' })
  @ApiResponse({ status: 403, description: 'Not a director or coordinator' })
  @ApiResponse({ status: 404, description: 'Indicator not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateIndicatorDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.indicators.update(id, dto, actor);
  }

  @RequireModule('PROJECTS')
  @Patch('indicators/:id/progress')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Change the progress of an indicator',
    description:
      'Either { delta: 1 | -1 } or { value }. The result is clamped to 0…targetValue.',
  })
  @ApiBody({ type: IndicatorProgressDto })
  @ApiResponse({ status: 200, description: 'Progress updated' })
  @ApiResponse({ status: 403, description: 'Not a director or coordinator' })
  @ApiResponse({ status: 404, description: 'Indicator not found' })
  async progress(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: IndicatorProgressDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.indicators.updateProgress(id, dto, actor);
  }

  @RequireModule('PROJECTS')
  @Delete('indicators/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an indicator' })
  @ApiResponse({ status: 204, description: 'Indicator deleted (no content)' })
  @ApiResponse({ status: 403, description: 'Not a director or coordinator' })
  @ApiResponse({ status: 404, description: 'Indicator not found' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    await this.indicators.remove(id, actor);
  }
}
