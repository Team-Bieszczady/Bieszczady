import {
  ArrayMinSize,
  ArrayNotEmpty,
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsNumberString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TrimmedString } from '../../common/decorators/trimmed-string.decorator';
import { InvoiceShareDto } from './invoice-share.dto';

export class CreateInvoiceDto {
  @TrimmedString()
  @IsNotEmpty()
  @MaxLength(200)
  name!: string;

  @IsNumberString({ no_symbols: false })
  amount!: string;

  @IsDateString({ strict: true })
  paymentDate!: string;

  @IsArray()
  @ArrayNotEmpty({ message: 'Podaj przynajmniej jeden projekt' })
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => InvoiceShareDto)
  shares!: InvoiceShareDto[];
}
