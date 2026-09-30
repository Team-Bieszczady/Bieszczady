import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateVersionDto {
  @IsString()
  @IsOptional()
  @MaxLength(500)
  changeNote?: string;

  @IsOptional()
  @IsIn(['true', 'false'])
  markSigned?: string;
}
