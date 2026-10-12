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
  let memberHasProjectModule: jest.Mock;

  const contextFor = (
    user?: Partial<AuthenticatedUser>,
    params?: { projectId?: string },
  ): ExecutionContext => new ExecutionContextHost([{ user, params }]);

  beforeEach(async () => {
    getAllAndOverride = jest.fn();
    userHasModule = jest.fn();
    memberHasProjectModule = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ModuleAccessGuard,
        { provide: Reflector, useValue: { getAllAndOverride } },
        {
          provide: ModuleAccessService,
          useValue: { userHasModule, memberHasProjectModule },
        },
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

  describe('per-project modules', () => {
    const member = { id: '1', isDirector: false };

    it('requires the module in the project from the route', async () => {
      getAllAndOverride.mockReturnValue('DOCUMENTS');
      userHasModule.mockResolvedValue(true);
      memberHasProjectModule.mockResolvedValue(true);

      await expect(
        guard.canActivate(contextFor(member, { projectId: 'p1' })),
      ).resolves.toBe(true);
      expect(memberHasProjectModule).toHaveBeenCalledWith(
        '1',
        'p1',
        'DOCUMENTS',
      );
    });

    it('rejects when the module is not ticked in that project', async () => {
      getAllAndOverride.mockReturnValue('BUDGET');
      userHasModule.mockResolvedValue(true);
      memberHasProjectModule.mockResolvedValue(false);

      await expect(
        guard.canActivate(contextFor(member, { projectId: 'p1' })),
      ).rejects.toThrow(/w tym projekcie/);
    });

    it('skips the project check for a module that is not per project', async () => {
      getAllAndOverride.mockReturnValue('PROJECTS');
      userHasModule.mockResolvedValue(true);

      await expect(
        guard.canActivate(contextFor(member, { projectId: 'p1' })),
      ).resolves.toBe(true);
      expect(memberHasProjectModule).not.toHaveBeenCalled();
    });

    it('skips the project check when the route has no projectId', async () => {
      getAllAndOverride.mockReturnValue('TASKS');
      userHasModule.mockResolvedValue(true);

      await expect(guard.canActivate(contextFor(member))).resolves.toBe(true);
      expect(memberHasProjectModule).not.toHaveBeenCalled();
    });

    it('never checks a director', async () => {
      getAllAndOverride.mockReturnValue('BUDGET');

      await expect(
        guard.canActivate(
          contextFor({ id: 'd1', isDirector: true }, { projectId: 'p1' }),
        ),
      ).resolves.toBe(true);
      expect(memberHasProjectModule).not.toHaveBeenCalled();
    });
  });
});
