import { BadRequestException } from '@nestjs/common';
import type { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';

export const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;

const ALLOWED_EXTENSIONS = [
  'pdf',
  'doc',
  'docx',
  'odt',
  'rtf',
  'txt',
  'xls',
  'xlsx',
  'ods',
  'csv',
  'ppt',
  'pptx',
  'odp',
  'jpg',
  'jpeg',
  'png',
  'gif',
  'webp',
  'zip',
];


export const DOCUMENT_UPLOAD_OPTIONS: MulterOptions = {
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
  fileFilter: (_req, file, callback) => {
const ext = file.originalname.split(".").pop()?.toLowerCase() ?? ''
if(ALLOWED_EXTENSIONS.includes(ext)){
    callback(null, true)
}else{
    callback(new BadRequestException('Niedozwolony typ pliku'), false);
}
  },
};
