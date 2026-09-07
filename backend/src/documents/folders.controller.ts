import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { FoldersService } from './folders.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PasswordChangeGuard } from '../auth/guards/password-change.guard';
import { CreateFolderDto } from './dto/create-folder.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { type AuthenticatedUser } from '../auth/types/auth.types';

@Controller('/projects/:projectId/folders')
export class FoldersController {
  constructor(private readonly foldersServie: FoldersService) {}

  @UseGuards(JwtAuthGuard, PasswordChangeGuard)
  @Get()
  async getFolders(@Param('projectId', ParseUUIDPipe) projectId: string) {
    return await this.foldersServie.findAllForProject(projectId);
  }

  @UseGuards(JwtAuthGuard, PasswordChangeGuard)
  @Post()
  async createFolder(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateFolderDto,
  ) {
    return await this.foldersServie.createFolder(projectId, user.id, dto);
  }
}
