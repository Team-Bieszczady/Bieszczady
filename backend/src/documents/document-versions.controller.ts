import { Controller, Get, Param, ParseIntPipe, ParseUUIDPipe, Res, StreamableFile, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { PasswordChangeGuard } from "../auth/guards/password-change.guard";
import { DocumentsService } from "./documents.service";
import { type Response } from 'express';

@Controller('/projects/:projectId/documents')
export class DocumentVersionsController {
  constructor(private readonly documentService: DocumentsService) {}

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
}