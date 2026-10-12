import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  Matches,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { TrimmedString } from '../../common/decorators/trimmed-string.decorator';
import {
  NAME_MAX_LENGTH,
  NAME_PATTERN,
  NAME_PATTERN_MESSAGE,
} from '../../common/validation/name';

const PHONE_PATTERN = /^[\d +()-]*$/;

const isFilledIn = (_: object, value: unknown) =>
  value !== undefined && value !== null && value !== '';

export class CreateParticipantDto {
  @TrimmedString()
  @IsNotEmpty()
  @MaxLength(NAME_MAX_LENGTH)
  @Matches(NAME_PATTERN, { message: NAME_PATTERN_MESSAGE })
  firstName!: string;

  @TrimmedString()
  @IsNotEmpty()
  @MaxLength(NAME_MAX_LENGTH)
  @Matches(NAME_PATTERN, { message: NAME_PATTERN_MESSAGE })
  lastName!: string;

  @ValidateIf(isFilledIn)
  @TrimmedString()
  @IsEmail({}, { message: 'Podaj poprawny adres e-mail' })
  @MaxLength(200)
  email?: string;

  @ValidateIf(isFilledIn)
  @TrimmedString()
  @MaxLength(20)
  @Matches(PHONE_PATTERN, {
    message: 'Telefon może zawierać tylko cyfry, spacje, +, - i nawiasy',
  })
  phone?: string;

  @ValidateIf(isFilledIn)
  @TrimmedString()
  @MaxLength(500)
  address?: string;

  @IsBoolean()
  hasConsent!: boolean;

  @ValidateIf(isFilledIn)
  @TrimmedString()
  @MaxLength(2000)
  note?: string;
}

export class UpdateParticipantDto extends CreateParticipantDto {}
