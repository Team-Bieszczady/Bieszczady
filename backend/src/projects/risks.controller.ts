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
import { RisksService } from './risks.service';
import { CreateRiskDto, UpdateRiskDto } from './dto/risk.dto';

@ApiTags('projects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, ModuleAccessGuard)
@Controller()
export class RisksController {
  constructor(private readonly risks: RisksService) {}

  @RequireModule('PROJECTS')
  @Get('projects/:projectId/risks')
  @ApiOperation({
    summary: 'List the risks of a project',
    description:
      'Each carries its probability and impact on the HIGH / MEDIUM / LOW scale, plus the responsible person.',
  })
  @ApiResponse({ status: 200, description: 'List of risks' })
  @ApiResponse({
    status: 404,
    description: 'Project not found, or the caller is not a member of it',
  })
  async list(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @CurrentUser() viewer: AuthenticatedUser,
  ) {
    return this.risks.findAllForProject(projectId, viewer);
  }

  @UseGuards(DirectorGuard)
  @RequireModule('PROJECTS')
  @Post('projects/:projectId/risks')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Register a risk',
    description:
      'The responsible user must already be a member of the project, so a risk always has someone accountable who is actually on it.',
  })
  @ApiBody({
    type: CreateRiskDto,
    examples: {
      example: {
        summary: 'New risk',
        value: {
          description: 'Może zabraknąć zgody właściciela działki.',
          probability: 'MEDIUM',
          impact: 'HIGH',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Risk created' })
  @ApiResponse({ status: 403, description: 'Director only' })
  @ApiResponse({
    status: 409,
    description: 'Responsible user is not a member of this project',
  })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async create(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() dto: CreateRiskDto,
  ) {
    return this.risks.create(projectId, dto);
  }

  @UseGuards(DirectorGuard)
  @RequireModule('PROJECTS')
  @Patch('risks/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Edit a risk' })
  @ApiBody({ type: UpdateRiskDto })
  @ApiResponse({ status: 200, description: 'Risk updated' })
  @ApiResponse({ status: 403, description: 'Director only' })
  @ApiResponse({
    status: 409,
    description: 'Responsible user is not a member of this project',
  })
  @ApiResponse({ status: 404, description: 'Risk not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRiskDto,
  ) {
    return this.risks.update(id, dto);
  }

  @UseGuards(DirectorGuard)
  @RequireModule('PROJECTS')
  @Delete('risks/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a risk' })
  @ApiResponse({ status: 204, description: 'Risk deleted (no content)' })
  @ApiResponse({ status: 403, description: 'Director only' })
  @ApiResponse({ status: 404, description: 'Risk not found' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.risks.remove(id);
  }
}
