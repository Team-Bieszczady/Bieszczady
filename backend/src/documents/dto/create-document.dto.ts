import { IsString, MaxLength, IsNotEmpty, IsIn } from 'class-validator';
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
}
