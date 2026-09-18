import {
  Body,
  Controller,
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

@Controller('/projects/:projectId/folders/:folderId/documents')
export class DocumentsController {
  constructor(private readonly documentService: DocumentsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, PasswordChangeGuard)
  @UseInterceptors(FileInterceptor('file'))
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
    );
  }

  @Get()
  @UseGuards(JwtAuthGuard, PasswordChangeGuard)
  async getDocument(
    @Param('projectId') projectId: string,
    @Param('folderId') folderId: string,
  ) {
    return await this.documentService.getDocuments(projectId, folderId);
  }


}
