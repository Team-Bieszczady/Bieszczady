import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import {
  AccountStatus,
  AuthenticatedUser,
  JwtPayload,
  UserRole,
} from './types/auth.types';
import { RefreshTokenService } from './refresh-token.service';

interface StoredUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  accountStatus: AccountStatus;
  mustChangePassword: boolean;
}

const DUMMY_PASSWORD_HASH =
  '$2b$10$.DnJAlyzBFH.ZiGkQiy5nuQSUoaSpZzPYaAMj59yL4PEcXo/2xflW';

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  user: AuthenticatedUser;
}

@Injectable()
export class AuthService {
  // TODO(F0.3): tymczasowe dane, po zmergowaniu modelu User podmienić na Prismę.

  private readonly users: StoredUser[] = [
    {
      id: '1',
      firstName: 'Jan',
      lastName: 'Kowalski',
      email: 'test@example.com',
      passwordHash:
        '$2b$10$4EhmxWW38ZDsw4eFtRKIZeQ1JKnzjdO4A8.qtUHhxqerUo6/fklmm',
      role: 'DIRECTOR',
      accountStatus: 'ACTIVE',
      mustChangePassword: false,
    },
  ];

  constructor(
    private readonly jwtService: JwtService,
    private readonly refreshTokens: RefreshTokenService,
  ) {}

  private findByEmail(email: string): StoredUser | undefined {
    return this.users.find((user) => user.email === email);
  }

  private findById(id: string): StoredUser | undefined {
    return this.users.find((user) => user.id === id);
  }

  private toAuthenticatedUser(user: StoredUser): AuthenticatedUser {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      accountStatus: user.accountStatus,
      mustChangePassword: user.mustChangePassword,
    };
  }

  getActiveUserById(id: string): AuthenticatedUser | null {
    const user = this.findById(id);
    if (!user || user.accountStatus !== 'ACTIVE') {
      return null;
    }
    return this.toAuthenticatedUser(user);
  }

  async validateUser(
    email: string,
    password: string,
  ): Promise<AuthenticatedUser | null> {
    const user = this.findByEmail(email);

    const isPasswordValid = await bcrypt.compare(
      password,
      user?.passwordHash ?? DUMMY_PASSWORD_HASH,
    );

    if (!user || !isPasswordValid || user.accountStatus !== 'ACTIVE') {
      return null;
    }

    return this.toAuthenticatedUser(user);
  }

  private async issueTokens(user: AuthenticatedUser): Promise<LoginResult> {
    const payload: JwtPayload = { sub: user.id, role: user.role };
    const accessToken = await this.jwtService.signAsync(payload);
    const refreshToken = this.refreshTokens.issue(user.id);

    return { accessToken, refreshToken, user };
  }

  async login(email: string, password: string): Promise<LoginResult> {
    const user = await this.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException();
    }

    return this.issueTokens(user);
  }

  async refresh(refreshToken: string): Promise<LoginResult> {
    const userId = this.refreshTokens.consume(refreshToken);
    if (!userId) {
      throw new UnauthorizedException();
    }

    const user = this.getActiveUserById(userId);
    if (!user) {
      throw new UnauthorizedException();
    }

    return this.issueTokens(user);
  }
}
