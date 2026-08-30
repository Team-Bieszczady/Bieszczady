import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsOptional,
  MinLength,
  MaxLength,
  Matches,
  IsArray,
  IsIn,
  ArrayUnique,
} from 'class-validator';
import { Module, MODULES } from '../../common/enums/module.enum';
import {
  NAME_MAX_LENGTH,
  NAME_PATTERN,
  NAME_PATTERN_MESSAGE,
} from '../../common/validation/name';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(NAME_MAX_LENGTH)
  @Matches(NAME_PATTERN, { message: NAME_PATTERN_MESSAGE })
  firstName!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(NAME_MAX_LENGTH)
  @Matches(NAME_PATTERN, { message: NAME_PATTERN_MESSAGE })
  lastName!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  phone?: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password!: string;

  @IsArray()
  @IsOptional()
  @ArrayUnique()
  @IsIn(MODULES, { each: true })
  modules?: Module[];
}
