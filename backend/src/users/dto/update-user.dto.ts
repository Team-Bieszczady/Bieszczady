import {
  IsString,
  IsNotEmpty,
  IsOptional,
  MaxLength,
  ValidateIf,
} from 'class-validator';

export class UpdateUserDto {
  // ValidateIf instead of IsOptional: IsOptional also skips null, which would
  // reach Prisma and fail on a NOT NULL column with a 500.
  @ValidateIf((_, value) => value !== undefined)
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  firstName?: string;

  @ValidateIf((_, value) => value !== undefined)
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  lastName?: string;

  // phone and avatar are nullable columns, so null is a valid way to clear them.
  @IsString()
  @IsOptional()
  @MaxLength(20)
  phone?: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  avatar?: string;
}
