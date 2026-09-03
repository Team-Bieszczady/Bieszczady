import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SKIP_PASSWORD_CHANGE_CHECK } from '../decorators/skip-password-change.decorator';
import { AuthenticatedUser } from '../types/auth.types';

@Injectable()
export class PasswordChangeGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const skipMustChangePassword = this.reflector.getAllAndOverride<
      boolean | undefined
    >(SKIP_PASSWORD_CHANGE_CHECK, [context.getHandler(), context.getClass()]);

    const { user } = context
      .switchToHttp()
      .getRequest<{ user?: AuthenticatedUser }>();
    if (skipMustChangePassword) {
      return true;
    }
    if (!user) {
      return true;
    }

    if (user.mustChangePassword) {
      throw new ForbiddenException('Ustaw własne hasło');
    }

    return true;
  }
}
