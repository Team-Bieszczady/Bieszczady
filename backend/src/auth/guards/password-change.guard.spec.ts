import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { ExecutionContextHost } from '@nestjs/core/helpers/execution-context-host';
import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { PasswordChangeGuard } from './password-change.guard';
import { AuthenticatedUser } from '../types/auth.types';

describe('PasswordChangeGuard', () => {
  let guard: PasswordChangeGuard;
  let getAllAndOverride: jest.Mock;

  const contextFor = (user?: Partial<AuthenticatedUser>): ExecutionContext =>
    new ExecutionContextHost([{ user }]);

  beforeEach(async () => {
    getAllAndOverride = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PasswordChangeGuard,
        { provide: Reflector, useValue: { getAllAndOverride } },
      ],
    }).compile();

    guard = module.get<PasswordChangeGuard>(PasswordChangeGuard);
  });

  it('rejects a user who still has to change their password', () => {
    getAllAndOverride.mockReturnValue(undefined);

    expect(() =>
      guard.canActivate(contextFor({ id: '1', mustChangePassword: true })),
    ).toThrow(ForbiddenException);
  });

  it('allows a user who has already changed their password', () => {
    getAllAndOverride.mockReturnValue(undefined);

    expect(
      guard.canActivate(contextFor({ id: '1', mustChangePassword: false })),
    ).toBe(true);
  });

  it('allows a marked route even when the flag is set', () => {
    getAllAndOverride.mockReturnValue(true);

    // Without this the flagged user would be locked out of the one endpoint
    // that can clear the flag, with no way back.
    expect(
      guard.canActivate(contextFor({ id: '1', mustChangePassword: true })),
    ).toBe(true);
  });

  it('allows a request that carries no user', () => {
    getAllAndOverride.mockReturnValue(undefined);

    // Authentication is JwtAuthGuard's job; an unauthenticated route is simply
    // none of this guard's business.
    expect(guard.canActivate(contextFor(undefined))).toBe(true);
  });
});
