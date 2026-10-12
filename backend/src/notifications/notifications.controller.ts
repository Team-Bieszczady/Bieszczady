import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/auth.types';
import { NotificationsService } from './notifications.service';

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  @ApiOperation({
    summary: 'List my notifications',
    description:
      'Task assignments and deadline notices for the caller, newest first (latest 50). Records any deadline notice that has come due before listing.',
  })
  @ApiResponse({ status: 200, description: '{ items, unreadCount }' })
  async findMine(@CurrentUser() viewer: AuthenticatedUser) {
    return this.notifications.findMine(viewer);
  }

  @Patch('read-all')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Mark all my notifications as read' })
  @ApiResponse({ status: 204, description: 'Marked' })
  async markAllRead(@CurrentUser() viewer: AuthenticatedUser) {
    await this.notifications.markAllRead(viewer);
  }

  @Patch(':id/read')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Mark one of my notifications as read' })
  @ApiResponse({ status: 204, description: 'Marked' })
  @ApiResponse({
    status: 404,
    description: 'Not found, or addressed to someone else',
  })
  async markRead(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() viewer: AuthenticatedUser,
  ) {
    await this.notifications.markRead(id, viewer);
  }
}
