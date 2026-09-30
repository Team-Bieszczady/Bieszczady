import { IsOptional, IsUUID } from 'class-validator';

export class RestoreDocumentDto {
  @IsOptional()
  @IsUUID()
  folderId?: string;
}
