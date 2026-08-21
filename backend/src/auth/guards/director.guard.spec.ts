import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { DirectorGuard } from './director.guard';
import { AuthenticatedUser } from '../types/auth.types';

describe('DirectorGuard', () => {
  const guard = new DirectorGuard();

  const contextFor = (user?: Partial<AuthenticatedUser>): ExecutionContext =>
    ({
      switchToHttp: () => ({ getRequest: () => ({ user }) }),
    }) as unknown as ExecutionContext;

  it('allows a director', () => {
    expect(guard.canActivate(contextFor({ isDirector: true }))).toBe(true);
  });

  it('rejects a user who is not a director', () => {
    expect(() => guard.canActivate(contextFor({ isDirector: false }))).toThrow(
      ForbiddenException,
    );
  });

  it('rejects when the request carries no user', () => {
    expect(() => guard.canActivate(contextFor(undefined))).toThrow(
      ForbiddenException,
    );
  });
});
