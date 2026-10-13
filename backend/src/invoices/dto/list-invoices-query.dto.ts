import { IsIn, IsOptional, IsUUID } from 'class-validator';
import { INVOICE_STATUSES, type InvoiceStatus } from './invoice-status';

export class ListInvoicesQueryDto {
  @IsOptional()
  @IsIn(INVOICE_STATUSES)
  status?: InvoiceStatus;

  @IsOptional()
  @IsUUID()
  projectId?: string;
}
