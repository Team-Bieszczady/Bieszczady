import { IsNumberString, IsUUID } from 'class-validator';

export class InvoiceShareDto {
  @IsUUID()
  projectId!: string;

  @IsNumberString({ no_symbols: false })
  amount!: string;
}
