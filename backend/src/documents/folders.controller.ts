import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { FoldersService } from './folders.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PasswordChangeGuard } from '../auth/guards/password-change.guard';
import { CreateFolderDto } from './dto/create-folder.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { type AuthenticatedUser } from '../auth/types/auth.types';
import { UpdateFolderDto } from './dto/update-folder.dto';

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

  @UseGuards(JwtAuthGuard, PasswordChangeGuard)
  @Patch('/:folderId')
  async updateFolder(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('folderId', ParseUUIDPipe) folderId: string,
    @Body() dto: UpdateFolderDto,
  ) {
    return await this.foldersServie.updateFolder(
      folderId,
      projectId,

      dto,
    );
  }

  @UseGuards(JwtAuthGuard, PasswordChangeGuard)
  @Delete('/:folderId')
  async deleteFolder(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('folderId', ParseUUIDPipe) folderId: string,
  ) {
    return await this.foldersServie.deleteFolder(folderId, projectId);
  }
}
