import {
  IsString,
  MaxLength,
  IsNotEmpty,
  IsIn,
  IsOptional,
} from 'class-validator';
import {
  DOCUMENT_KINDS,
  type DocumentKind,
} from '../../common/enums/document.enums';

export class CreateDocumentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name!: string;

  @IsIn(DOCUMENT_KINDS)
  kind!: DocumentKind;

  @IsOptional()
  @IsIn(['true', 'false'])
  asDraft?: string;
}
