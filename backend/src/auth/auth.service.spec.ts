import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { RefreshTokenService } from './refresh-token.service';

describe('AuthService', () => {
  const PASSWORD = 'haslo123';
  const ACTIVE_EMAIL = 'test@example.com';
  const INACTIVE_EMAIL = 'inactive@example.com';

  let service: AuthService;

  beforeEach(() => {
    const jwtService = {
      signAsync: jest.fn().mockResolvedValue('access-token'),
    } as unknown as JwtService;

    service = new AuthService(jwtService, new RefreshTokenService());
  });

  describe('login', () => {
    it('returns tokens and the user for correct credentials', async () => {
      const result = await service.login(ACTIVE_EMAIL, PASSWORD);

      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toHaveLength(64);
      expect(result.user.email).toBe(ACTIVE_EMAIL);
    });

    it('never exposes the password hash', async () => {
      const { user } = await service.login(ACTIVE_EMAIL, PASSWORD);

      expect(user).not.toHaveProperty('passwordHash');
    });

    it('accepts the email in any casing', async () => {
      const result = await service.login('TEST@Example.COM', PASSWORD);

      expect(result.user.email).toBe(ACTIVE_EMAIL);
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
    it('returns the user for an active account', () => {
      expect(service.getActiveUserById('1')?.email).toBe(ACTIVE_EMAIL);
    });

    it('returns null for an inactive account', () => {
      expect(service.getActiveUserById('2')).toBeNull();
    });

    it('returns null for an unknown id', () => {
      expect(service.getActiveUserById('does-not-exist')).toBeNull();
    });
  });
});
