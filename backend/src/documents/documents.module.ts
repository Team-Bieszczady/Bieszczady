import { Module } from '@nestjs/common';
import { FoldersService } from './folders.service';
import { FoldersController } from './folders.controller';
import { StorageService } from './storage.service';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';

@Module({
  controllers: [FoldersController, DocumentsController],
  providers: [FoldersService, StorageService, DocumentsService],
})
export class DocumentsModule {}
