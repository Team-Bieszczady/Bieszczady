import { Transform } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsDateString,
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  Matches,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import {
  PARTNER_AGREEMENTS,
  PARTNER_STATUSES,
  PARTNER_TYPES,
  type PartnerAgreement,
  type PartnerStatus,
  type PartnerType,
} from '../../common/enums/project.enums';
import { TrimmedString } from '../../common/decorators/trimmed-string.decorator';

const stripNip = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.replace(/[\s-]/g, '') : value;

export class CreatePartnerDto {
  @TrimmedString()
  @IsNotEmpty()
  @MaxLength(200)
  name!: string;

  @IsIn(PARTNER_TYPES)
  type!: PartnerType;

  @ValidateIf((_, value) => value !== undefined)
  @Transform(stripNip)
  @Matches(/^(\d{10})?$/, { message: 'NIP musi mieć 10 cyfr' })
  nip?: string;

  @ValidateIf((_, value) => value !== undefined)
  @TrimmedString()
  @MaxLength(100)
  city?: string;

  @ValidateIf((_, value) => value !== undefined && value !== '')
  @TrimmedString()
  @IsEmail()
  @MaxLength(200)
  email?: string;

  @TrimmedString()
  @IsNotEmpty()
  @MaxLength(200)
  contactName!: string;

  @TrimmedString()
  @IsEmail()
  @MaxLength(200)
  contactEmail!: string;

  @ValidateIf((_, value) => value !== undefined)
  @TrimmedString()
  @MaxLength(50)
  contactPhone?: string;

  @IsIn(PARTNER_AGREEMENTS)
  agreement!: PartnerAgreement;

  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsDateString()
  @IsOptional()
  agreementValidUntil?: string | null;

  @IsIn(PARTNER_STATUSES)
  @IsOptional()
  status?: PartnerStatus;

  @IsArray()
  @ArrayUnique()
  @IsUUID('all', { each: true })
  @IsOptional()
  projectIds?: string[];
}

export class UpdatePartnerDto {
  @ValidateIf((_, value) => value !== undefined)
  @TrimmedString()
  @IsNotEmpty()
  @MaxLength(200)
  name?: string;

  @IsIn(PARTNER_TYPES)
  @IsOptional()
  type?: PartnerType;

  @ValidateIf((_, value) => value !== undefined)
  @Transform(stripNip)
  @Matches(/^(\d{10})?$/, { message: 'NIP musi mieć 10 cyfr' })
  nip?: string;

  @ValidateIf((_, value) => value !== undefined)
  @TrimmedString()
  @MaxLength(100)
  city?: string;

  @ValidateIf((_, value) => value !== undefined && value !== '')
  @TrimmedString()
  @IsEmail()
  @MaxLength(200)
  email?: string;

  @ValidateIf((_, value) => value !== undefined)
  @TrimmedString()
  @IsNotEmpty()
  @MaxLength(200)
  contactName?: string;

  @ValidateIf((_, value) => value !== undefined)
  @TrimmedString()
  @IsEmail()
  @MaxLength(200)
  contactEmail?: string;

  @ValidateIf((_, value) => value !== undefined)
  @TrimmedString()
  @MaxLength(50)
  contactPhone?: string;

  @IsIn(PARTNER_AGREEMENTS)
  @IsOptional()
  agreement?: PartnerAgreement;

  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsDateString()
  @IsOptional()
  agreementValidUntil?: string | null;

  @IsIn(PARTNER_STATUSES)
  @IsOptional()
  status?: PartnerStatus;

  @IsArray()
  @ArrayUnique()
  @IsUUID('all', { each: true })
  @IsOptional()
  projectIds?: string[];
}
