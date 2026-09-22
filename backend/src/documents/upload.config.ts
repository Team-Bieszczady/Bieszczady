import { BadRequestException } from '@nestjs/common';
import type { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';

export const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;

const ALLOWED_TYPES: Record<string, string[]> = {
  pdf: ['application/pdf'],
  doc: ['application/msword'],
  docx: [
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
  odt: ['application/vnd.oasis.opendocument.text'],
  rtf: ['application/rtf', 'text/rtf'],
  txt: ['text/plain'],
  xls: ['application/vnd.ms-excel'],
  xlsx: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  ods: ['application/vnd.oasis.opendocument.spreadsheet'],
  csv: ['text/csv', 'application/csv', 'text/plain'],
  ppt: ['application/vnd.ms-powerpoint'],
  pptx: [
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  ],
  odp: ['application/vnd.oasis.opendocument.presentation'],
  jpg: ['image/jpeg'],
  jpeg: ['image/jpeg'],
  png: ['image/png'],
  gif: ['image/gif'],
  webp: ['image/webp'],
  zip: ['application/zip', 'application/x-zip-compressed'],
};

export const DOCUMENT_UPLOAD_OPTIONS: MulterOptions = {
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
  fileFilter: (_req, file, callback) => {
    const ext = file.originalname.split('.').pop()?.toLowerCase() ?? '';
    const allowed = ALLOWED_TYPES[ext];

    if (!allowed) {
      callback(new BadRequestException('Niedozwolony typ pliku'), false);
      return;
    }
    if (!allowed.includes(file.mimetype)) {
      callback(
        new BadRequestException('Typ pliku nie zgadza się z rozszerzeniem'),
        false,
      );
      return;
    }
    callback(null, true);
  },
};
