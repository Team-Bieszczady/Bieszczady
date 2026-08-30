import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  Patch,
  Delete,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ListUsersQueryDto } from './dto/list-users-query.dto';
import { UpdateAccountStatusDto } from './dto/update-account-status.dto';
import { UpdateDirectorStatusDto } from './dto/update-director-status.dto';
import { UpdateUserModulesDto } from './dto/update-user-modules.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DirectorGuard } from '../auth/guards/director.guard';
import { ModuleAccessGuard } from '../auth/guards/module-access.guard';
import { RequireModule } from '../auth/decorators/require-module.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { type AuthenticatedUser } from '../auth/types/auth.types';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, ModuleAccessGuard)
@Controller('users')
export class UserController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(DirectorGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new user',
    description:
      'Director-only. The director supplies the initial password; it is hashed and mustChangePassword is set, so the user must replace it on first login. Default module access is granted, plus anything in `modules`.',
  })
  @ApiBody({
    type: CreateUserDto,
    examples: {
      withPhone: {
        summary: 'Create user with phone',
        value: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          phone: '+1-555-0123',
          password: 'SecurePass123!',
        },
      },
      withoutPhone: {
        summary: 'Create user without phone',
        value: {
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane.smith@example.com',
          password: 'SecurePass456!',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'User successfully created',
    example: {
      id: '550e8400-e29b-41d4-a716-446655440000',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '+1-555-0123',
      avatar: null,
      accountStatus: 'ACTIVE',
      isDirector: false,
      mustChangePassword: true,
      lastLogin: null,
      createdAt: '2026-08-20T10:30:00.000Z',
      updatedAt: '2026-08-20T10:30:00.000Z',
      deletedAt: null,
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input or validation failed',
  })
  @ApiResponse({ status: 409, description: 'Email already in use' })
  async create(
    @Body() createUserDto: CreateUserDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.usersService.create(actor.id, createUserDto);
  }

  @RequireModule('PEOPLE')
  @Get()
  @ApiOperation({
    summary: 'Get all users',
    description:
      'Soft-deleted users are excluded by default. Directors may pass ?includeDeleted=true to get them as well (each carries a non-null deletedAt); for anyone else the flag is ignored.',
  })
  @ApiQuery({
    name: 'includeDeleted',
    required: false,
    type: Boolean,
    description: 'Director-only. Include soft-deleted users in the response.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of all users',
  })
  async getAll(
    @Query() query: ListUsersQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.usersService.findAll(user.isDirector && !!query.includeDeleted);
  }

  @Get('me')
  @ApiOperation({
    summary: 'Get current user',
  })
  @ApiResponse({
    status: 200,
    description: 'Current user data',
    example: {
      id: '550e8400-e29b-41d4-a716-446655440000',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '+1-555-0123',
      avatar: null,
      accountStatus: 'ACTIVE',
      isDirector: false,
      mustChangePassword: false,
      lastLogin: '2026-08-20T10:30:00.000Z',
      createdAt: '2026-08-20T10:30:00.000Z',
      updatedAt: '2026-08-20T10:30:00.000Z',
      deletedAt: null,
    },
  })
  @ApiResponse({ status: 404, description: 'User not found or deleted' })
  async getMe(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.findById(user.id);
  }

  @RequireModule('PEOPLE')
  @Get(':id')
  @ApiOperation({
    summary: 'Get user by ID',
    description: 'Returns user details excluding password hash',
  })
  @ApiResponse({
    status: 200,
    description: 'User found',
    example: {
      id: '550e8400-e29b-41d4-a716-446655440000',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '+1-555-0123',
      avatar: null,
      accountStatus: 'ACTIVE',
      isDirector: false,
      mustChangePassword: false,
      lastLogin: '2026-08-20T10:30:00.000Z',
      createdAt: '2026-08-20T10:30:00.000Z',
      updatedAt: '2026-08-20T10:30:00.000Z',
      deletedAt: null,
    },
  })
  @ApiResponse({ status: 404, description: 'User not found or deleted' })
  async getById(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findById(id);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update own user profile',
    description:
      'Self-edit only: firstName, lastName, phone, avatar. Email, accountStatus, isDirector cannot be changed here.',
  })
  @ApiBody({
    type: UpdateUserDto,
    examples: {
      fullUpdate: {
        summary: 'Update all allowed fields',
        value: {
          firstName: 'Jonathan',
          lastName: 'Smith',
          phone: '+1-555-9999',
          avatar: 'https://example.com/avatar.jpg',
        },
      },
      partialUpdate: {
        summary: 'Update only some fields',
        value: {
          firstName: 'Jonathan',
          phone: '+1-555-9999',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Profile updated',
    example: {
      id: '550e8400-e29b-41d4-a716-446655440000',
      firstName: 'Jonathan',
      lastName: 'Smith',
      email: 'john.doe@example.com',
      phone: '+1-555-9999',
      avatar: 'https://example.com/avatar.jpg',
      accountStatus: 'ACTIVE',
      isDirector: false,
      mustChangePassword: false,
      lastLogin: '2026-08-20T10:30:00.000Z',
      createdAt: '2026-08-20T10:30:00.000Z',
      updatedAt: '2026-08-20T10:35:00.000Z',
      deletedAt: null,
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input',
  })
  @ApiResponse({ status: 403, description: 'Cannot edit another user' })
  @ApiResponse({ status: 404, description: 'User not found or deleted' })
  async updateSelf(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return await this.usersService.updateSelf(user.id, id, dto);
  }

  @UseGuards(DirectorGuard)
  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Change user account status',
    description:
      'Toggle between ACTIVE and INACTIVE. Cannot deactivate last active director.',
  })
  @ApiBody({
    type: UpdateAccountStatusDto,
    examples: {
      deactivate: {
        summary: 'Deactivate user',
        value: { accountStatus: 'INACTIVE' },
      },
      activate: {
        summary: 'Activate user',
        value: { accountStatus: 'ACTIVE' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Status changed',
    example: {
      id: '550e8400-e29b-41d4-a716-446655440000',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '+1-555-0123',
      avatar: null,
      accountStatus: 'INACTIVE',
      isDirector: false,
      mustChangePassword: false,
      lastLogin: '2026-08-20T10:30:00.000Z',
      createdAt: '2026-08-20T10:30:00.000Z',
      updatedAt: '2026-08-20T10:40:00.000Z',
      deletedAt: null,
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({
    status: 409,
    description: 'Cannot deactivate last remaining active director',
  })
  @ApiResponse({ status: 404, description: 'User not found or deleted' })
  async setAccountStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAccountStatusDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.usersService.setAccountStatus(actor.id, id, dto.accountStatus);
  }

  @UseGuards(DirectorGuard)
  @Patch(':id/director-status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Grant or revoke director status',
    description:
      'Grant/revoke global admin privilege. Audit logged. Cannot self-revoke or remove last active director.',
  })
  @ApiBody({
    type: UpdateDirectorStatusDto,
    examples: {
      grant: {
        summary: 'Grant director status',
        value: { isDirector: true },
      },
      revoke: {
        summary: 'Revoke director status',
        value: { isDirector: false },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Director status changed and audit logged',
    example: {
      id: '550e8400-e29b-41d4-a716-446655440000',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '+1-555-0123',
      avatar: null,
      accountStatus: 'ACTIVE',
      isDirector: true,
      mustChangePassword: false,
      lastLogin: '2026-08-20T10:30:00.000Z',
      createdAt: '2026-08-20T10:30:00.000Z',
      updatedAt: '2026-08-20T10:45:00.000Z',
      deletedAt: null,
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input',
  })
  @ApiResponse({
    status: 403,
    description: 'Cannot self-revoke or insufficient permissions',
  })
  @ApiResponse({
    status: 409,
    description: 'Cannot remove last remaining active director',
  })
  @ApiResponse({ status: 404, description: 'User not found or deleted' })
  async setDirectorStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDirectorStatusDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.usersService.setDirectorStatus(user.id, id, dto.isDirector);
  }

  @UseGuards(DirectorGuard)
  @Patch(':id/modules')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update user module access',
    description:
      'Grant or revoke module access for a user. Full-replace semantics: submit the complete set of modules.',
  })
  @ApiBody({
    type: UpdateUserModulesDto,
    examples: {
      example: {
        summary: 'Grant multiple modules',
        value: { modules: ['OVERVIEW', 'TASKS', 'CALENDAR', 'PEOPLE'] },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Module access updated and audit logged',
    example: { modules: ['OVERVIEW', 'TASKS', 'CALENDAR', 'PEOPLE'] },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input',
  })
  @ApiResponse({ status: 404, description: 'User not found or deleted' })
  async setModuleAccess(
    @Param('id') id: string,
    @Body() dto: UpdateUserModulesDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.usersService.setModuleAccess(actor.id, id, dto.modules);
  }

  @Post('me/password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Change own password',
    description:
      'Change password after verifying current password. Sets mustChangePassword to false.',
  })
  @ApiResponse({
    status: 200,
    description: 'Password changed successfully',
    example: { success: true },
  })
  @ApiBody({
    type: ChangePasswordDto,
    examples: {
      passwordChange: {
        summary: 'Change password',
        value: {
          currentPassword: 'OldPass123!',
          newPassword: 'NewSecurePass456!',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input',
  })
  @ApiResponse({
    status: 401,
    description: 'Current password is incorrect',
  })
  @ApiResponse({ status: 404, description: 'User not found or deleted' })
  async changeOwnPassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ChangePasswordDto,
  ) {
    await this.usersService.changeOwnPassword(user.id, dto);
    return { success: true };
  }

  @UseGuards(DirectorGuard)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Soft-delete user',
    description:
      'Mark user as deleted (sets deletedAt). User cannot be retrieved. Cannot delete last active director.',
  })
  @ApiResponse({
    status: 204,
    description: 'User deleted (no content)',
  })
  @ApiResponse({
    status: 409,
    description: 'Cannot delete last remaining active director',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found or already deleted',
  })
  async softDelete(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    await this.usersService.softDeleteUser(actor.id, id);
  }
}
