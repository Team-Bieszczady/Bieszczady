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
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import {
  ListProjectsQueryDto,
  UpdateProjectDto,
  UpdateProjectRecipientsDto,
  UpdateProjectStatusDto,
  UpdateProjectTypesDto,
} from './dto/update-project.dto';

@ApiTags('projects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, ModuleAccessGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projects: ProjectsService) {}

  @UseGuards(DirectorGuard)
  @RequireModule('PROJECTS')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a project',
    description:
      'Director-only. Types, recipients and members are attached in the same transaction. Only ACTIVE users may be added as members.',
  })
  @ApiBody({
    type: CreateProjectDto,
    examples: {
      full: {
        summary: 'With dictionaries and a team',
        value: {
          name: 'Ścieżka edukacyjna w Berehach',
          description: 'Ścieżka przyrodnicza z tablicami edukacyjnymi.',
          color: 'green',
          budgetAmount: '120000.00',
          startDate: '2026-10-01',
          plannedEndDate: '2027-07-22',
          typeIds: [],
          recipientIds: [],
          members: [],
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Project created' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 403, description: 'Director only' })
  @ApiResponse({ status: 409, description: 'A member is not an active user' })
  @ApiResponse({
    status: 404,
    description: 'Status, type or recipient not found',
  })
  async create(@Body() dto: CreateProjectDto) {
    return this.projects.create(dto);
  }

  @RequireModule('PROJECTS')
  @Get()
  @ApiOperation({
    summary: 'List projects',
    description:
      'Archived projects are excluded by default. Each row carries the figures the project cards need: peopleCount, progress, stageLabel and daysLeft.',
  })
  @ApiQuery({
    name: 'archived',
    required: false,
    type: Boolean,
    description: 'Include archived projects.',
  })
  @ApiResponse({ status: 200, description: 'List of projects' })
  async findAll(
    @Query() query: ListProjectsQueryDto,
    @CurrentUser() viewer: AuthenticatedUser,
  ) {
    return this.projects.findAll(!!query.archived, viewer);
  }

  @RequireModule('PROJECTS')
  @Get(':id')
  @ApiOperation({
    summary: 'Get one project',
    description:
      'The Przegląd header: name, description, status, types, recipients, budget and dates. Goals, risks, members and stages have their own endpoints. Scoped to membership like GET /projects: a director reaches any project, anyone else only the ones they belong to — a non-member gets 404, not 403, so the id is not confirmed.',
  })
  @ApiResponse({ status: 200, description: 'Project found' })
  @ApiResponse({
    status: 404,
    description: 'Project not found, or the caller is not a member of it',
  })
  async findById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() viewer: AuthenticatedUser,
  ) {
    return this.projects.findById(id, viewer);
  }

  @UseGuards(DirectorGuard)
  @RequireModule('PROJECTS')
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Edit the project info block',
    description:
      'Name, description, colour and the two dates. Either date may be sent as null to ' +
      'clear it. Budget is deliberately not editable here.',
  })
  @ApiBody({ type: UpdateProjectDto })
  @ApiResponse({ status: 200, description: 'Project updated' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 403, description: 'Director only' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  @ApiResponse({
    status: 409,
    description: 'Start date is after the planned end date',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProjectDto,
  ) {
    return this.projects.update(id, dto);
  }

  @UseGuards(DirectorGuard)
  @RequireModule('PROJECTS')
  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Set the project status' })
  @ApiBody({ type: UpdateProjectStatusDto })
  @ApiResponse({ status: 200, description: 'Status set' })
  @ApiResponse({ status: 403, description: 'Director only' })
  @ApiResponse({ status: 404, description: 'Project or status not found' })
  async setStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProjectStatusDto,
  ) {
    return this.projects.setStatus(id, dto);
  }

  @UseGuards(DirectorGuard)
  @RequireModule('PROJECTS')
  @Patch(':id/types')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Replace the project types',
    description: 'Full-replace semantics: submit the complete set.',
  })
  @ApiBody({ type: UpdateProjectTypesDto })
  @ApiResponse({ status: 200, description: 'Types replaced' })
  @ApiResponse({ status: 403, description: 'Director only' })
  @ApiResponse({ status: 404, description: 'Project or type not found' })
  async setTypes(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProjectTypesDto,
  ) {
    return this.projects.setTypes(id, dto);
  }

  @UseGuards(DirectorGuard)
  @RequireModule('PROJECTS')
  @Patch(':id/recipients')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Replace the project recipients',
    description: 'Full-replace semantics: submit the complete set.',
  })
  @ApiBody({ type: UpdateProjectRecipientsDto })
  @ApiResponse({ status: 200, description: 'Recipients replaced' })
  @ApiResponse({ status: 403, description: 'Director only' })
  @ApiResponse({ status: 404, description: 'Project or recipient not found' })
  async setRecipients(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProjectRecipientsDto,
  ) {
    return this.projects.setRecipients(id, dto);
  }

  @UseGuards(DirectorGuard)
  @RequireModule('PROJECTS')
  @Patch(':id/archive')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Archive a project',
    description:
      'Moves the project to the bin: it drops out of the default list but nothing is destroyed.',
  })
  @ApiResponse({ status: 200, description: 'Project archived' })
  @ApiResponse({ status: 403, description: 'Director only' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async archive(@Param('id', ParseUUIDPipe) id: string) {
    return this.projects.setArchived(id, true);
  }

  @UseGuards(DirectorGuard)
  @RequireModule('PROJECTS')
  @Patch(':id/restore')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Restore an archived project' })
  @ApiResponse({ status: 200, description: 'Project restored' })
  @ApiResponse({ status: 403, description: 'Director only' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async restore(@Param('id', ParseUUIDPipe) id: string) {
    return this.projects.setArchived(id, false);
  }

  @UseGuards(DirectorGuard)
  @RequireModule('PROJECTS')
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a project permanently',
    description:
      'Empties the bin: removes the project and every stage, activity, task, goal, risk and membership under it. Refused unless the project is already archived.',
  })
  @ApiResponse({ status: 204, description: 'Project deleted (no content)' })
  @ApiResponse({ status: 403, description: 'Director only' })
  @ApiResponse({ status: 409, description: 'Project is not archived' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.projects.remove(id);
  }
}
