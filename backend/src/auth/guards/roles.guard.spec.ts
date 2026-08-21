import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { AuthenticatedUser, UserRole } from '../types/auth.types';

describe('RolesGuard', () => {
  let reflector: Reflector;
  let guard: RolesGuard;

  const contextFor = (user?: Partial<AuthenticatedUser>): ExecutionContext =>
    ({
      getHandler: () => undefined,
      getClass: () => undefined,
      switchToHttp: () => ({ getRequest: () => ({ user }) }),
    }) as unknown as ExecutionContext;

  const routeRequires = (roles?: UserRole[]) =>
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(roles);

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  it('allows a route that declares no roles', () => {
    routeRequires(undefined);

    expect(guard.canActivate(contextFor({ role: 'EXECUTOR' }))).toBe(true);
  });

  it('allows a user whose role is listed', () => {
    routeRequires(['DIRECTOR']);

    expect(guard.canActivate(contextFor({ role: 'DIRECTOR' }))).toBe(true);
  });

  it('rejects a user whose role is not listed', () => {
    routeRequires(['DIRECTOR']);

    expect(() => guard.canActivate(contextFor({ role: 'EXECUTOR' }))).toThrow(
      ForbiddenException,
    );
  });

  it('rejects when the request carries no user', () => {
    routeRequires(['DIRECTOR']);

    expect(() => guard.canActivate(contextFor(undefined))).toThrow(
      ForbiddenException,
    );
  });
});
