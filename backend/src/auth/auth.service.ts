import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { User } from '@prisma/client';
import { AuthenticatedUser, JwtPayload } from './types/auth.types';
import { RefreshTokenService } from './refresh-token.service';
import { UsersService } from '../users/users.service';

// Compared against when no user matches, so a failed login takes the same
// time whether the account exists or not (prevents user enumeration).
const DUMMY_PASSWORD_HASH =
  '$2b$10$.DnJAlyzBFH.ZiGkQiy5nuQSUoaSpZzPYaAMj59yL4PEcXo/2xflW';

interface LoginResult {
  accessToken: string;
  refreshToken: string;
  user: AuthenticatedUser;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly refreshTokens: RefreshTokenService,
    private readonly usersService: UsersService,
  ) {}

  private toAuthenticatedUser(
    user: Omit<User, 'passwordHash'>,
  ): AuthenticatedUser {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      isDirector: user.isDirector,
      accountStatus: user.accountStatus === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE',
      mustChangePassword: user.mustChangePassword,
    };
  }

  async getActiveUserById(id: string): Promise<AuthenticatedUser | null> {
    const user = await this.usersService.findByIdForAuth(id);

    if (!user || user.accountStatus !== 'ACTIVE') {
      return null;
    }

    return this.toAuthenticatedUser(user);
  }

  private async validateUser(
    email: string,
    password: string,
  ): Promise<AuthenticatedUser | null> {
    const user = await this.usersService.findByEmailForAuth(email);

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
    const payload: JwtPayload = { sub: user.id };
    const accessToken = await this.jwtService.signAsync(payload);
    const refreshToken = this.refreshTokens.issue(user.id);

    return { accessToken, refreshToken, user };
  }

  async login(email: string, password: string): Promise<LoginResult> {
    const user = await this.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException();
    }

    const tokens = await this.issueTokens(user);
    await this.usersService.recordLogin(user.id);

    return tokens;
  }

  async refresh(refreshToken: string): Promise<LoginResult> {
    const userId = this.refreshTokens.consume(refreshToken);
    if (!userId) {
      throw new UnauthorizedException();
    }

    const user = await this.getActiveUserById(userId);
    if (!user) {
      throw new UnauthorizedException();
    }

    return this.issueTokens(user);
  }

  logout(refreshToken: string): void {
    this.refreshTokens.revoke(refreshToken);
  }
}
