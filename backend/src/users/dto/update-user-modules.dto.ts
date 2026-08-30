import { IsArray, IsIn, ArrayUnique } from 'class-validator';
import { Module, MODULES } from '../../common/enums/module.enum';

export class UpdateUserModulesDto {
  @IsArray()
  @ArrayUnique()
  @IsIn(MODULES, { each: true })
  modules!: Module[];
}
