import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateDocumentDto } from './dto/create-document.dto';
import { type AuthenticatedUser } from '../auth/types/auth.types';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PasswordChangeGuard } from '../auth/guards/password-change.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { DOCUMENT_UPLOAD_OPTIONS } from './upload.config';
import { ModuleAccessGuard } from '../auth/guards/module-access.guard';
import { RequireModule } from '../auth/decorators/require-module.decorator';

@Controller('/projects/:projectId/folders/:folderId/documents')
@UseGuards(JwtAuthGuard, PasswordChangeGuard, ModuleAccessGuard)
@RequireModule('DOCUMENTS')
export class DocumentsController {
  constructor(private readonly documentService: DocumentsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file', DOCUMENT_UPLOAD_OPTIONS))
  async createDocument(
    @Param('projectId') projectId: string,
    @Param('folderId') folderId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateDocumentDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return await this.documentService.createDocument(
      projectId,
      folderId,
      user.id,
      dto,
      file,
      user,
    );
  }

  @Get()
  async getDocument(
    @Param('projectId') projectId: string,
    @Param('folderId') folderId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return await this.documentService.getDocuments(projectId, folderId, user);
  }
}
