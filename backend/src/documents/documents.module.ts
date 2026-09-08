import { Module } from '@nestjs/common';
import { FoldersService } from './folders.service';
import { FoldersController } from './folders.controller';
import { StorageService } from './storage.service';

@Module({
  controllers: [FoldersController],
  providers: [FoldersService, StorageService],
})
export class DocumentsModule {}
