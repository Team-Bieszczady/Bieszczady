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
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateAccountStatusDto } from './dto/update-account-status.dto';
import { UpdateDirectorStatusDto } from './dto/update-director-status.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DirectorGuard } from '../auth/guards/director.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { type AuthenticatedUser } from '../auth/types/auth.types';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UserController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(DirectorGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new user',
    description:
      'Creates a new user with server-generated temporary password. Returns user object and tempPassword.',
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
        },
      },
      withoutPhone: {
        summary: 'Create user without phone',
        value: {
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane.smith@example.com',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'User successfully created',
    example: {
      user: {
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
      tempPassword: 'AZ9k7mL2pQ_wXfR5tN8vJ',
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input or validation failed',
  })
  @ApiResponse({ status: 409, description: 'Email already in use' })
  async create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
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
  // TODO(auth): open to any authenticated user; confirm whether it should be
  // director-or-self only.
  async getById(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
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
    @Param('id') id: string,
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
    @Param('id') id: string,
    @Body() dto: UpdateAccountStatusDto,
  ) {
    return this.usersService.setAccountStatus(id, dto.accountStatus);
  }

  @UseGuards(DirectorGuard)
  @Patch(':id/director-status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Grant or revoke director status',
    description:
      'Grant/revoke global admin privilege. Audit logged. Cannot self-revoke or remove last active director.',
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
    @Param('id') id: string,
    @Body() dto: UpdateDirectorStatusDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.usersService.setDirectorStatus(user.id, id, dto.isDirector);
  }

  @Post('me/password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Change own password',
    description:
      'Change password after verifying current password. Sets mustChangePassword to false.',
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
  async softDelete(@Param('id') id: string) {
    await this.usersService.softDeleteUser(id);
  }
}
