import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import { AuthService } from './auth.service';
import { RefreshTokenService } from './refresh-token.service';
import { UsersService } from '../users/users.service';
import { ModuleAccessService } from '../users/module-access.service';
import { PasswordResetTokenService } from './password-reset-token.service';
import { MailService } from '../mail/mail.service';
import { Module } from '../common/enums/module.enum';

describe('AuthService', () => {
  const PASSWORD = 'haslo123';
  const PASSWORD_HASH =
    '$2b$10$4EhmxWW38ZDsw4eFtRKIZeQ1JKnzjdO4A8.qtUHhxqerUo6/fklmm';
  const ACTIVE_EMAIL = 'test@example.com';
  const INACTIVE_EMAIL = 'inactive@example.com';

  const makeUser = (overrides: Partial<User>): User => ({
    id: '1',
    firstName: 'Jan',
    lastName: 'Kowalski',
    email: ACTIVE_EMAIL,
    phone: null,
    passwordHash: PASSWORD_HASH,
    avatar: null,
    accountStatus: 'ACTIVE',
    isDirector: true,
    mustChangePassword: false,
    lastLogin: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
  });

  const users: User[] = [
    makeUser({}),
    makeUser({
      id: '2',
      firstName: 'Anna',
      lastName: 'Nowak',
      email: INACTIVE_EMAIL,
      accountStatus: 'INACTIVE',
      isDirector: false,
    }),
  ];

  const GRANTED_MODULES: Module[] = ['OVERVIEW', 'TASKS', 'CALENDAR'];

  let service: AuthService;
  let recordLogin: jest.Mock;
  let issueResetToken: jest.Mock;
  let consumeResetToken: jest.Mock;
  let sendPasswordReset: jest.Mock;
  let setPassword: jest.Mock;

  beforeEach(async () => {
    recordLogin = jest.fn();
    issueResetToken = jest.fn().mockResolvedValue('reset-token');
    consumeResetToken = jest.fn();
    sendPasswordReset = jest.fn();
    setPassword = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        RefreshTokenService,
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn().mockResolvedValue('access-token'),
          },
        },
        {
          provide: UsersService,
          useValue: {
            recordLogin,
            setPassword,
            findByEmailForAuth: (email: string) =>
              Promise.resolve(
                users.find((user) => user.email === email) ?? null,
              ),
            findByEmail: (email: string) =>
              Promise.resolve(
                users.find((user) => user.email === email) ?? null,
              ),
            findByIdForAuth: (id: string) =>
              Promise.resolve(users.find((user) => user.id === id) ?? null),
          },
        },
        {
          provide: ModuleAccessService,
          useValue: {
            getEffectiveModules: jest.fn().mockResolvedValue(GRANTED_MODULES),
          },
        },
        {
          provide: PasswordResetTokenService,
          useValue: {
            issue: issueResetToken,
            consume: consumeResetToken,
          },
        },
        {
          provide: MailService,
          useValue: {
            sendPasswordReset,
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('login', () => {
    it('returns tokens and the user for correct credentials', async () => {
      const result = await service.login(ACTIVE_EMAIL, PASSWORD);

      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toHaveLength(64);
      expect(result.user.email).toBe(ACTIVE_EMAIL);
    });

    it('carries the effective module list on the returned user', async () => {
      const { user } = await service.login(ACTIVE_EMAIL, PASSWORD);

      expect(user.modules).toEqual(GRANTED_MODULES);
    });

    it('never exposes the password hash', async () => {
      const { user } = await service.login(ACTIVE_EMAIL, PASSWORD);

      expect(user).not.toHaveProperty('passwordHash');
    });

    it('rejects a wrong password', async () => {
      await expect(
        service.login(ACTIVE_EMAIL, 'wrong-password'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('rejects an unknown email', async () => {
      await expect(
        service.login('nobody@example.com', PASSWORD),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('rejects an inactive account even with the right password', async () => {
      await expect(service.login(INACTIVE_EMAIL, PASSWORD)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('records the login timestamp', async () => {
      await service.login(ACTIVE_EMAIL, PASSWORD);

      expect(recordLogin).toHaveBeenCalledWith('1');
    });

    it('records nothing when the login fails', async () => {
      await expect(
        service.login(ACTIVE_EMAIL, 'wrong-password'),
      ).rejects.toThrow(UnauthorizedException);

      expect(recordLogin).not.toHaveBeenCalled();
    });
  });

  describe('refresh', () => {
    it('issues a new pair and invalidates the old refresh token', async () => {
      const first = await service.login(ACTIVE_EMAIL, PASSWORD);
      const second = await service.refresh(first.refreshToken);

      expect(second.refreshToken).not.toBe(first.refreshToken);
      await expect(service.refresh(first.refreshToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('rejects an unknown token', async () => {
      await expect(service.refresh('not-a-real-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('getActiveUserById', () => {
    it('returns the user for an active account', async () => {
      const user = await service.getActiveUserById('1');

      expect(user?.email).toBe(ACTIVE_EMAIL);
    });

    it('returns null for an inactive account', async () => {
      await expect(service.getActiveUserById('2')).resolves.toBeNull();
    });

    it('returns null for an unknown id', async () => {
      await expect(
        service.getActiveUserById('does-not-exist'),
      ).resolves.toBeNull();
    });
  });

  describe('requestPasswordReset', () => {
    it('issues a token and sends the link for an active account', async () => {
      await service.requestPasswordReset(ACTIVE_EMAIL);

      expect(issueResetToken).toHaveBeenCalledWith('1');
      expect(sendPasswordReset).toHaveBeenCalledWith(
        ACTIVE_EMAIL,
        'reset-token',
      );
    });

    it('does nothing for an unknown address', async () => {
      await service.requestPasswordReset('nobody@example.com');

      expect(issueResetToken).not.toHaveBeenCalled();
      expect(sendPasswordReset).not.toHaveBeenCalled();
    });

    it('does nothing for an inactive account', async () => {
      await service.requestPasswordReset(INACTIVE_EMAIL);

      expect(issueResetToken).not.toHaveBeenCalled();
      expect(sendPasswordReset).not.toHaveBeenCalled();
    });

    it('resolves without throwing for an unknown address', async () => {
      // The caller must not be able to tell an existing account from a missing
      // one, so this path stays silent rather than raising NotFound.
      await expect(
        service.requestPasswordReset('nobody@example.com'),
      ).resolves.toBeUndefined();
    });
  });

  describe('confirmPasswordReset', () => {
    const VALID = {
      token: 'a-token',
      newPassword: 'NoweHaslo1!',
      confirmPassword: 'NoweHaslo1!',
    };

    it('sets the new password for a valid token', async () => {
      consumeResetToken.mockResolvedValue('1');

      await service.confirmPasswordReset(VALID);

      expect(setPassword).toHaveBeenCalledWith('1', 'NoweHaslo1!');
    });

    it('rejects mismatched passwords', async () => {
      await expect(
        service.confirmPasswordReset({
          ...VALID,
          confirmPassword: 'InneHaslo1!',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('does not consume the token when the passwords differ', async () => {
      await service
        .confirmPasswordReset({ ...VALID, confirmPassword: 'InneHaslo1!' })
        .catch(() => undefined);

      expect(consumeResetToken).not.toHaveBeenCalled();
    });

    it('rejects an invalid, expired or already used token', async () => {
      consumeResetToken.mockResolvedValue(null);

      await expect(service.confirmPasswordReset(VALID)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('does not touch the password when the token is rejected', async () => {
      consumeResetToken.mockResolvedValue(null);

      await service.confirmPasswordReset(VALID).catch(() => undefined);

      expect(setPassword).not.toHaveBeenCalled();
    });
  });
});
