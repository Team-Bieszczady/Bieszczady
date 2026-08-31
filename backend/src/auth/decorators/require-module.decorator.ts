import { SetMetadata } from '@nestjs/common';
import { Module } from '../../common/enums/module.enum';

export const MODULE_KEY = 'requiredModule';
export const RequireModule = (module: Module) =>
  SetMetadata(MODULE_KEY, module);
