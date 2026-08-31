import { Injectable, ForbiddenException } from '@nestjs/common';
import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { MODULE_KEY } from '../decorators/require-module.decorator';
import { AuthenticatedUser } from '../types/auth.types';
import { ModuleAccessService } from '../../users/module-access.service';
import { Module } from '../../common/enums/module.enum';

@Injectable()
export class ModuleAccessGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly moduleAccess: ModuleAccessService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredModule = this.reflector.getAllAndOverride<Module | undefined>(
      MODULE_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredModule) {
      return true;
    }

    const { user } = context
      .switchToHttp()
      .getRequest<{ user?: AuthenticatedUser }>();

    if (!user) {
      throw new ForbiddenException();
    }
    if (user.isDirector) {
      return true;
    }
    const hasAccess = await this.moduleAccess.userHasModule(
      user.id,
      requiredModule,
    );
    if (!hasAccess) {
      throw new ForbiddenException();
    }

    return true;
  }
}
