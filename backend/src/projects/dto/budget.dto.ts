import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  Matches,
  MaxLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import {
  BUDGET_COLUMN_TYPES,
  BUDGET_DOCUMENT_KINDS,
  BUDGET_INVOICE_STATUSES,
  type BudgetColumnType,
  type BudgetDocumentKind,
  type BudgetInvoiceStatus,
} from '../../common/enums/project.enums';
import { TrimmedString } from '../../common/decorators/trimmed-string.decorator';

export const MONEY_PATTERN = /^\d{1,10}(\.\d{1,2})?$/;
const MONEY_MESSAGE = 'Wpisz kwotę, np. 1500 lub 1500.50';

export class DocumentLinkDto {
  @IsIn(BUDGET_DOCUMENT_KINDS)
  kind!: BudgetDocumentKind;

  @IsUUID()
  folderId!: string;

  @ValidateIf((dto: DocumentLinkDto) => dto.kind === 'FILE')
  @IsUUID()
  documentId?: string;
}

export class CreateBudgetCategoryDto {
  @TrimmedString()
  @IsNotEmpty()
  @MaxLength(200)
  name!: string;

  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsUUID()
  @IsOptional()
  partnerId?: string | null;
}

export class UpdateBudgetCategoryDto {
  @ValidateIf((_, value) => value !== undefined)
  @TrimmedString()
  @IsNotEmpty()
  @MaxLength(200)
  name?: string;

  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsUUID()
  @IsOptional()
  partnerId?: string | null;
}

export class CreateBudgetPositionDto {
  @ValidateIf((_, value) => value !== undefined)
  @TrimmedString()
  @IsNotEmpty()
  @MaxLength(200)
  name?: string;
}

export class UpdateBudgetPositionDto {
  @ValidateIf((_, value) => value !== undefined)
  @TrimmedString()
  @IsNotEmpty()
  @MaxLength(200)
  name?: string;

  @ValidateIf((_, value) => value !== undefined)
  @TrimmedString()
  @Matches(MONEY_PATTERN, { message: MONEY_MESSAGE })
  planned?: string;

  @ValidateIf((_, value) => value !== undefined)
  @TrimmedString()
  @Matches(MONEY_PATTERN, { message: MONEY_MESSAGE })
  grant?: string;

  @ValidateIf((_, value) => value !== undefined)
  @TrimmedString()
  @Matches(MONEY_PATTERN, { message: MONEY_MESSAGE })
  ownContribution?: string;
}

export class CreateBudgetColumnDto {
  @TrimmedString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @IsIn(BUDGET_COLUMN_TYPES)
  type!: BudgetColumnType;
}

export class RenameBudgetColumnDto {
  @TrimmedString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;
}

export class UpdateBudgetCellDto {
  @TrimmedString()
  @MaxLength(2000)
  value!: string;
}

export class UpdateBudgetActualDto {
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsIn(BUDGET_INVOICE_STATUSES)
  @IsOptional()
  status?: BudgetInvoiceStatus | null;

  @ValidateIf((_, value) => value !== null && value !== undefined)
  @ValidateNested()
  @Type(() => DocumentLinkDto)
  @IsOptional()
  document?: DocumentLinkDto | null;
}

export class CreateBudgetInvoiceDto {
  @TrimmedString()
  @IsNotEmpty()
  @MaxLength(100)
  number!: string;

  @TrimmedString()
  @IsNotEmpty()
  @MaxLength(200)
  contractor!: string;

  @IsDateString()
  date!: string;

  @TrimmedString()
  @Matches(MONEY_PATTERN, { message: MONEY_MESSAGE })
  amount!: string;

  @ValidateIf((_, value) => value !== undefined)
  @TrimmedString()
  @Matches(MONEY_PATTERN, { message: MONEY_MESSAGE })
  grant?: string;

  @ValidateIf((_, value) => value !== undefined)
  @TrimmedString()
  @Matches(MONEY_PATTERN, { message: MONEY_MESSAGE })
  ownContribution?: string;

  @ValidateIf((_, value) => value !== null && value !== undefined)
  @ValidateNested()
  @Type(() => DocumentLinkDto)
  @IsOptional()
  document?: DocumentLinkDto | null;
}

export class UpdateBudgetInvoiceStatusDto {
  @IsIn(BUDGET_INVOICE_STATUSES)
  status!: BudgetInvoiceStatus;
}

export class MoveBudgetActualsDto {
  @TrimmedString()
  @IsNotEmpty()
  fromPositionKey!: string;

  @TrimmedString()
  @IsNotEmpty()
  toPositionKey!: string;
}

export class UpdateBudgetCategorySettingsDto {
  @IsBoolean()
  @IsOptional()
  detailed?: boolean;

  @IsBoolean()
  @IsOptional()
  partnerCanEdit?: boolean;

  @IsBoolean()
  @IsOptional()
  visibleToPartner?: boolean;

  @ValidateIf((_, value) => value !== null && value !== undefined)
  @ValidateNested()
  @Type(() => DocumentLinkDto)
  @IsOptional()
  document?: DocumentLinkDto | null;
}

export class GrantBudgetAccessDto {
  @IsUUID()
  userId!: string;
}

export class BudgetDescriptionDto {
  @TrimmedString()
  @IsNotEmpty({ message: 'Podaj opis aneksu' })
  @MaxLength(2000)
  description!: string;
}

export class BudgetCommentDto {
  @TrimmedString()
  @IsNotEmpty({ message: 'Komentarz jest wymagany' })
  @MaxLength(2000)
  comment!: string;
}

export class BudgetReasonDto {
  @TrimmedString()
  @IsNotEmpty({ message: 'Podaj powód' })
  @MaxLength(2000)
  reason!: string;
}
