import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Res,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PasswordChangeGuard } from '../auth/guards/password-change.guard';
import { DocumentsService } from './documents.service';
import { type Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { type AuthenticatedUser } from '../auth/types/auth.types';
import { CreateVersionDto } from './dto/create-version.dto';
import { RestoreDocumentDto } from './dto/restore-document.dto';
import { DOCUMENT_UPLOAD_OPTIONS } from './upload.config';
import { UpdateDocumentDto } from './dto/update-document.dto';

@Controller('/projects/:projectId/documents')
export class DocumentVersionsController {
  constructor(private readonly documentService: DocumentsService) {}

  @Get('/trash')
  @UseGuards(JwtAuthGuard, PasswordChangeGuard)
  async getTrash(@Param('projectId', ParseUUIDPipe) projectId: string) {
    return await this.documentService.getTrash(projectId);
  }

  @Get('/:documentId/versions/:versionNo/download')
  @UseGuards(JwtAuthGuard, PasswordChangeGuard)
  async downloadDocument(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('documentId', ParseUUIDPipe) documentId: string,
    @Param('versionNo', ParseIntPipe) versionNo: number,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { buffer, fileName, mimeType } =
      await this.documentService.downloadDocument(
        projectId,
        documentId,
        versionNo,
      );
    res.set({
      'Content-Type': mimeType,
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
    });

    return new StreamableFile(buffer);
  }

  @Post('/:documentId/versions')
  @UseGuards(JwtAuthGuard, PasswordChangeGuard)
  @UseInterceptors(FileInterceptor('file', DOCUMENT_UPLOAD_OPTIONS))
  async createVersion(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('documentId', ParseUUIDPipe) documentId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateVersionDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return await this.documentService.createVersion(
      documentId,
      projectId,
      user.id,
      dto,
      file,
    );
  }

  @Get('/:documentId/versions')
  @UseGuards(JwtAuthGuard, PasswordChangeGuard)
  async getDocumentsVersions(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('documentId', ParseUUIDPipe) documentId: string,
  ) {
    return await this.documentService.getVersions(projectId, documentId);
  }

  @Delete('/:documentId/permanent')
  @HttpCode(204)
  @UseGuards(JwtAuthGuard, PasswordChangeGuard)
  async deleteDocumentPermanent(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('documentId', ParseUUIDPipe) documentId: string,
  ) {
    return await this.documentService.deleteDocumentPermanently(
      projectId,
      documentId,
    );
  }

  @Delete('/:documentId')
  @UseGuards(JwtAuthGuard, PasswordChangeGuard)
  async deleteDocument(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('documentId', ParseUUIDPipe) documentId: string,
  ) {
    return await this.documentService.deleteDocument(projectId, documentId);
  }

  @Post('/:documentId/restore')
  @UseGuards(JwtAuthGuard, PasswordChangeGuard)
  async restoreDocument(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('documentId', ParseUUIDPipe) documentId: string,
    @Body() body: RestoreDocumentDto,
  ) {
    return await this.documentService.restoreDocument(
      projectId,
      documentId,
      body,
    );
  }
  @Patch('/:documentId')
  @UseGuards(JwtAuthGuard, PasswordChangeGuard)
  async updateDocument(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('documentId', ParseUUIDPipe) documentId: string,
    @Body() body: UpdateDocumentDto,
  ) {
    return await this.documentService.updateDocument(
      projectId,
      documentId,
      body,
    );
  }
  @Post('/:documentId/versions/:versionNo/restore')
  @UseGuards(JwtAuthGuard, PasswordChangeGuard)
  async restoreVersion(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('documentId', ParseUUIDPipe) documentId: string,
    @Param('versionNo', ParseIntPipe) versionNo: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return await this.documentService.restoreVersion(
      projectId,
      documentId,
      versionNo,
      user.id,
    );
  }
}
