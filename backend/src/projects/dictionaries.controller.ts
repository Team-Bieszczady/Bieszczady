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
import { DictionariesService } from './dictionaries.service';
import {
  CreateDictionaryEntryDto,
  CreateStatusDto,
  UpdateDictionaryEntryDto,
  UpdateStatusDto,
} from './dto/dictionary.dto';

const IN_USE = 'Entry is still used by one or more projects';

@ApiTags('projects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, ModuleAccessGuard)
@Controller('project-statuses')
export class ProjectStatusesController {
  constructor(private readonly dictionaries: DictionariesService) {}

  @RequireModule('PROJECTS')
  @Get()
  @ApiOperation({
    summary: 'List project statuses',
    description: 'Each entry carries a colour used to render its pill.',
  })
  @ApiResponse({ status: 200, description: 'List of statuses' })
  async list() {
    return this.dictionaries.listStatuses();
  }

  @UseGuards(DirectorGuard)
  @RequireModule('PROJECTS')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a project status' })
  @ApiBody({
    type: CreateStatusDto,
    examples: {
      example: {
        summary: 'New status',
        value: { name: 'Zawieszony', color: 'amber' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Status created' })
  @ApiResponse({ status: 403, description: 'Director only' })
  @ApiResponse({ status: 409, description: 'Name already in use' })
  async create(@Body() dto: CreateStatusDto) {
    return this.dictionaries.createStatus(dto.name, dto.color ?? 'gray');
  }

  @UseGuards(DirectorGuard)
  @RequireModule('PROJECTS')
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rename or recolour a status' })
  @ApiBody({ type: UpdateStatusDto })
  @ApiResponse({ status: 200, description: 'Status updated' })
  @ApiResponse({ status: 403, description: 'Director only' })
  @ApiResponse({ status: 409, description: 'Name already in use' })
  @ApiResponse({ status: 404, description: 'Status not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateStatusDto,
  ) {
    return this.dictionaries.updateStatus(id, dto);
  }

  @UseGuards(DirectorGuard)
  @RequireModule('PROJECTS')
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a status',
    description:
      'Refused while any project still uses it; the message names how many do.',
  })
  @ApiResponse({ status: 204, description: 'Status deleted (no content)' })
  @ApiResponse({ status: 403, description: 'Director only' })
  @ApiResponse({ status: 409, description: IN_USE })
  @ApiResponse({ status: 404, description: 'Status not found' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.dictionaries.removeStatus(id);
  }
}

@ApiTags('projects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, ModuleAccessGuard)
@Controller('project-types')
export class ProjectTypesController {
  constructor(private readonly dictionaries: DictionariesService) {}

  @RequireModule('PROJECTS')
  @Get()
  @ApiOperation({ summary: 'List project types' })
  @ApiResponse({ status: 200, description: 'List of types' })
  async list() {
    return this.dictionaries.listTypes();
  }

  @UseGuards(DirectorGuard)
  @RequireModule('PROJECTS')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a project type' })
  @ApiBody({
    type: CreateDictionaryEntryDto,
    examples: {
      example: { summary: 'New type', value: { name: 'Edukacja' } },
    },
  })
  @ApiResponse({ status: 201, description: 'Type created' })
  @ApiResponse({ status: 403, description: 'Director only' })
  @ApiResponse({ status: 409, description: 'Name already in use' })
  async create(@Body() dto: CreateDictionaryEntryDto) {
    return this.dictionaries.createType(dto.name);
  }

  @UseGuards(DirectorGuard)
  @RequireModule('PROJECTS')
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rename a type' })
  @ApiBody({ type: UpdateDictionaryEntryDto })
  @ApiResponse({ status: 200, description: 'Type updated' })
  @ApiResponse({ status: 403, description: 'Director only' })
  @ApiResponse({ status: 409, description: 'Name already in use' })
  @ApiResponse({ status: 404, description: 'Type not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDictionaryEntryDto,
  ) {
    return this.dictionaries.updateType(id, dto);
  }

  @UseGuards(DirectorGuard)
  @RequireModule('PROJECTS')
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a type',
    description: 'Refused while any project still uses it.',
  })
  @ApiResponse({ status: 204, description: 'Type deleted (no content)' })
  @ApiResponse({ status: 403, description: 'Director only' })
  @ApiResponse({ status: 409, description: IN_USE })
  @ApiResponse({ status: 404, description: 'Type not found' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.dictionaries.removeType(id);
  }
}

@ApiTags('projects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, ModuleAccessGuard)
@Controller('project-recipients')
export class ProjectRecipientsController {
  constructor(private readonly dictionaries: DictionariesService) {}

  @RequireModule('PROJECTS')
  @Get()
  @ApiOperation({ summary: 'List project recipients (odbiorcy)' })
  @ApiResponse({ status: 200, description: 'List of recipients' })
  async list() {
    return this.dictionaries.listRecipients();
  }

  @UseGuards(DirectorGuard)
  @RequireModule('PROJECTS')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a recipient' })
  @ApiBody({
    type: CreateDictionaryEntryDto,
    examples: {
      example: { summary: 'New recipient', value: { name: 'Seniorzy' } },
    },
  })
  @ApiResponse({ status: 201, description: 'Recipient created' })
  @ApiResponse({ status: 403, description: 'Director only' })
  @ApiResponse({ status: 409, description: 'Name already in use' })
  async create(@Body() dto: CreateDictionaryEntryDto) {
    return this.dictionaries.createRecipient(dto.name);
  }

  @UseGuards(DirectorGuard)
  @RequireModule('PROJECTS')
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rename a recipient' })
  @ApiBody({ type: UpdateDictionaryEntryDto })
  @ApiResponse({ status: 200, description: 'Recipient updated' })
  @ApiResponse({ status: 403, description: 'Director only' })
  @ApiResponse({ status: 409, description: 'Name already in use' })
  @ApiResponse({ status: 404, description: 'Recipient not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDictionaryEntryDto,
  ) {
    return this.dictionaries.updateRecipient(id, dto);
  }

  @UseGuards(DirectorGuard)
  @RequireModule('PROJECTS')
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a recipient',
    description: 'Refused while any project still uses it.',
  })
  @ApiResponse({ status: 204, description: 'Recipient deleted (no content)' })
  @ApiResponse({ status: 403, description: 'Director only' })
  @ApiResponse({ status: 409, description: IN_USE })
  @ApiResponse({ status: 404, description: 'Recipient not found' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.dictionaries.removeRecipient(id);
  }
}
