import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Res,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { type Response } from 'express';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequireModule } from '../auth/decorators/require-module.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ModuleAccessGuard } from '../auth/guards/module-access.guard';
import { PasswordChangeGuard } from '../auth/guards/password-change.guard';
import { type AuthenticatedUser } from '../auth/types/auth.types';
import { DOCUMENT_UPLOAD_OPTIONS } from '../documents/upload.config';
import { MeetingAttendanceService } from './meeting-attendance.service';

@Controller('meetings/:meetingId/attendance-files')
@UseGuards(JwtAuthGuard, PasswordChangeGuard, ModuleAccessGuard)
@RequireModule('CALENDAR')
export class MeetingAttendanceController {
  constructor(private readonly attendance: MeetingAttendanceService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file', DOCUMENT_UPLOAD_OPTIONS))
  upload(
    @Param('meetingId', ParseUUIDPipe) meetingId: string,
    @UploadedFile() file: Express.Multer.File | undefined,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.attendance.upload(meetingId, file, user);
  }

  @Get(':fileId/download')
  async download(
    @Param('meetingId', ParseUUIDPipe) meetingId: string,
    @Param('fileId', ParseUUIDPipe) fileId: string,
    @Res({ passthrough: true }) res: Response,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const { buffer, fileName, mimeType } = await this.attendance.download(
      meetingId,
      fileId,
      user,
    );
    res.set({
      'Content-Type': mimeType,
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
    });

    return new StreamableFile(buffer);
  }

  @Delete(':fileId')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('meetingId', ParseUUIDPipe) meetingId: string,
    @Param('fileId', ParseUUIDPipe) fileId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.attendance.remove(meetingId, fileId, user);
  }
}
