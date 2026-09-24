import { Module } from '@nestjs/common';
import { FoldersService } from './folders.service';
import { FoldersController } from './folders.controller';
import { StorageService } from './storage.service';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { DocumentVersionsController } from './document-versions.controller';
import { UsersModule } from '../users/users.module';
import { ProjectsModule } from '../projects/projects.module';
import { DocumentAccessService } from './document-access.service';

@Module({
  controllers: [
    FoldersController,
    DocumentsController,
    DocumentVersionsController,
  ],
  providers: [FoldersService, StorageService, DocumentsService, DocumentAccessService],
  imports: [UsersModule, ProjectsModule],
})
export class DocumentsModule {}
