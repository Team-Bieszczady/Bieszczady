import { IsBoolean } from 'class-validator';

export class UpdateDirectorStatusDto {
  @IsBoolean()
  isDirector!: boolean;
}
