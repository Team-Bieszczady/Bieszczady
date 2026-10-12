import { Module } from '@nestjs/common';
import { DocumentsModule } from '../documents/documents.module';
import { ProjectsModule } from '../projects/projects.module';
import { UsersModule } from '../users/users.module';
import { InvoiceDocumentsService } from './invoice-documents.service';
import { InvoicesController } from './invoices.controller';
import { InvoicesService } from './invoices.service';

@Module({
  imports: [UsersModule, ProjectsModule, DocumentsModule],
  controllers: [InvoicesController],
  providers: [InvoicesService, InvoiceDocumentsService],
})
export class InvoicesModule {}
