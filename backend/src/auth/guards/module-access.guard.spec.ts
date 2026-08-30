import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { ExecutionContextHost } from '@nestjs/core/helpers/execution-context-host';
import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { ModuleAccessGuard } from './module-access.guard';
import { ModuleAccessService } from '../../users/module-access.service';
import { AuthenticatedUser } from '../types/auth.types';

describe('ModuleAccessGuard', () => {
  let guard: ModuleAccessGuard;
  let getAllAndOverride: jest.Mock;
  let userHasModule: jest.Mock;

  const contextFor = (user?: Partial<AuthenticatedUser>): ExecutionContext =>
    new ExecutionContextHost([{ user }]);

  beforeEach(async () => {
    getAllAndOverride = jest.fn();
    userHasModule = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ModuleAccessGuard,
        { provide: Reflector, useValue: { getAllAndOverride } },
        { provide: ModuleAccessService, useValue: { userHasModule } },
      ],
    }).compile();

    guard = module.get<ModuleAccessGuard>(ModuleAccessGuard);
  });

  it('allows a route with no @RequireModule marker', async () => {
    getAllAndOverride.mockReturnValue(undefined);

    await expect(guard.canActivate(contextFor())).resolves.toBe(true);
    expect(userHasModule).not.toHaveBeenCalled();
  });

  it('rejects when the request carries no user', async () => {
    getAllAndOverride.mockReturnValue('PEOPLE');

    await expect(guard.canActivate(contextFor(undefined))).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('lets a director through without checking module access', async () => {
    getAllAndOverride.mockReturnValue('PEOPLE');

    await expect(
      guard.canActivate(contextFor({ id: '1', isDirector: true })),
    ).resolves.toBe(true);
    expect(userHasModule).not.toHaveBeenCalled();
  });

  it('allows a non-director holding the module', async () => {
    getAllAndOverride.mockReturnValue('PEOPLE');
    userHasModule.mockResolvedValue(true);

    await expect(
      guard.canActivate(contextFor({ id: '1', isDirector: false })),
    ).resolves.toBe(true);
    expect(userHasModule).toHaveBeenCalledWith('1', 'PEOPLE');
  });

  it('rejects a non-director without the module', async () => {
    getAllAndOverride.mockReturnValue('PEOPLE');
    userHasModule.mockResolvedValue(false);

    await expect(
      guard.canActivate(contextFor({ id: '1', isDirector: false })),
    ).rejects.toThrow(ForbiddenException);
  });
});
