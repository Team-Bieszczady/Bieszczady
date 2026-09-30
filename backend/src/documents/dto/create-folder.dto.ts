import {
  IsString,
  MaxLength,
  IsOptional,
  IsNotEmpty,
  IsUUID,
} from 'class-validator';

export class CreateFolderDto {
  @IsString()
  @IsOptional()
  @IsUUID()
  parentId?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  name!: string;
}
