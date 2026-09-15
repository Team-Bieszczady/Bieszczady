import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateVersionDto {
  @IsString()
  @IsOptional()
  @MaxLength(500)
  changeNote?: string;
}
