import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class UpdateUserDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @MaxLength(60)
  firstName?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @MaxLength(60)
  lastName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  phone?: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  avatar?: string;
}
