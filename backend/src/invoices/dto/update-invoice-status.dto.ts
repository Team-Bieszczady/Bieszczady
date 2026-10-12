import { IsIn } from 'class-validator';
import { INVOICE_STATUSES, type InvoiceStatus } from './invoice-status';

export class UpdateInvoiceStatusDto {
  @IsIn(INVOICE_STATUSES)
  status!: InvoiceStatus;
}
