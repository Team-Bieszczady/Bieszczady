import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { ExecutionContextHost } from '@nestjs/core/helpers/execution-context-host';
import { DirectorGuard } from './director.guard';
import { AuthenticatedUser } from '../types/auth.types';

describe('DirectorGuard', () => {
  const guard = new DirectorGuard();

  const contextFor = (user?: Partial<AuthenticatedUser>): ExecutionContext =>
    new ExecutionContextHost([{ user }]);

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
