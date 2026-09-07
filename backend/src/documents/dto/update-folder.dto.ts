import { IsString, MaxLength, IsOptional, IsUUID } from 'class-validator';

export class UpdateFolderDto {
  @IsString()
  @IsOptional()
  @IsUUID()
  parentId?: string;

  @IsString()
  @IsOptional()
  @MaxLength(40)
  name?: string;
}
