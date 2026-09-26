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
import { ModuleAccessGuard } from '../auth/guards/module-access.guard';
import { RequireModule } from '../auth/decorators/require-module.decorator';

@Controller('/projects/:projectId/folders')
@UseGuards(JwtAuthGuard, PasswordChangeGuard, ModuleAccessGuard)
@RequireModule('DOCUMENTS')
export class FoldersController {
  constructor(private readonly foldersService: FoldersService) {}

  @Get()
  async getFolders(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return await this.foldersService.findAllForProject(projectId, user);
  }

  @Post()
  async createFolder(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateFolderDto,
  ) {
    return await this.foldersService.createFolder(
      projectId,
      user.id,
      dto,
      user,
    );
  }
  @Post('/template')
  async createTemplate(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return await this.foldersService.createTemplate(projectId, user.id, user);
  }

  @Patch('/:folderId')
  async updateFolder(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('folderId', ParseUUIDPipe) folderId: string,
    @Body() dto: UpdateFolderDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return await this.foldersService.updateFolder(
      folderId,
      projectId,

      dto,
      user,
    );
  }

  @Delete('/:folderId')
  async deleteFolder(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('folderId', ParseUUIDPipe) folderId: string,

    @CurrentUser() user: AuthenticatedUser,
  ) {
    return await this.foldersService.deleteFolder(folderId, projectId, user);
  }
}
