import { IsIn, IsOptional, IsUUID } from 'class-validator';
import {
  ACCESS_LEVELS,
  type AccessLevel,
} from '../../common/enums/document.enums';

export class GrantAccessDto {
  @IsUUID()
  userId!: string;

  @IsIn(ACCESS_LEVELS)
  level!: AccessLevel;

  @IsOptional()
  @IsUUID()
  folderId?: string;

  @IsOptional()
  @IsUUID()
  documentId?: string;
}
