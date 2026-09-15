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
import { MembersService } from './members.service';
import { AddMemberDto, UpdateMemberRoleDto } from './dto/member.dto';

@ApiTags('projects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, ModuleAccessGuard)
@Controller()
export class MembersController {
  constructor(private readonly members: MembersService) {}

  @RequireModule('PROJECTS')
  @Get('projects/:projectId/members')
  @ApiOperation({
    summary: 'List the team of a project',
    description:
      'Each row carries the project role — COORDINATOR / EXECUTOR / PARTNER — which is per project, not per user.',
  })
  @ApiResponse({ status: 200, description: 'List of members' })
  @ApiResponse({
    status: 404,
    description: 'Project not found, or the caller is not a member of it',
  })
  async list(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @CurrentUser() viewer: AuthenticatedUser,
  ) {
    return this.members.findAllForProject(projectId, viewer);
  }

  @RequireModule('PROJECTS')
  @Get('projects/:projectId/available-members')
  @ApiOperation({
    summary: 'List users who may still be added',
    description:
      'Active, not deleted, and not already on the project. This is what the picker should read, so it can never offer someone the API would refuse.',
  })
  @ApiResponse({ status: 200, description: 'List of candidates' })
  @ApiResponse({
    status: 404,
    description: 'Project not found, or the caller is not a member of it',
  })
  async available(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @CurrentUser() viewer: AuthenticatedUser,
  ) {
    return this.members.findAvailable(projectId, viewer);
  }

  @UseGuards(DirectorGuard)
  @RequireModule('PROJECTS')
  @Post('projects/:projectId/members')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Add a member to a project',
    description: 'Only ACTIVE, non-deleted users may be added.',
  })
  @ApiBody({
    type: AddMemberDto,
    examples: {
      example: {
        summary: 'Add an executor',
        value: {
          userId: '5eed0000-0004-4000-8000-000000000001',
          projectRole: 'EXECUTOR',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Member added' })
  @ApiResponse({ status: 403, description: 'Director only' })
  @ApiResponse({
    status: 409,
    description: 'User is inactive, or already a member',
  })
  @ApiResponse({ status: 404, description: 'Project or user not found' })
  async add(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() dto: AddMemberDto,
  ) {
    return this.members.add(projectId, dto);
  }

  @UseGuards(DirectorGuard)
  @RequireModule('PROJECTS')
  @Patch('members/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Change a member role in this project',
    description:
      'The same person may hold a different role on another project.',
  })
  @ApiBody({ type: UpdateMemberRoleDto })
  @ApiResponse({ status: 200, description: 'Role changed' })
  @ApiResponse({ status: 403, description: 'Director only' })
  @ApiResponse({ status: 404, description: 'Project member not found' })
  async setRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMemberRoleDto,
  ) {
    return this.members.setRole(id, dto);
  }

  @UseGuards(DirectorGuard)
  @RequireModule('PROJECTS')
  @Delete('members/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Remove a member from a project',
    description:
      'Anything they were responsible for on this project — risks, tasks — is left unassigned rather than blocking the removal. The user account itself is untouched.',
  })
  @ApiResponse({ status: 204, description: 'Member removed (no content)' })
  @ApiResponse({ status: 403, description: 'Director only' })
  @ApiResponse({ status: 404, description: 'Project member not found' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.members.remove(id);
  }
}
