import {
  Injectable,
  UnauthorizedException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { User } from '@prisma/client';
import { AuthenticatedUser, JwtPayload } from './types/auth.types';
import { RefreshTokenService } from './refresh-token.service';
import { UsersService } from '../users/users.service';
import { ModuleAccessService } from '../users/module-access.service';
import { PasswordResetTokenService } from './password-reset-token.service';
import { MailService } from '../mail/mail.service';
import { ConfirmPasswordResetDto } from './dto/confirm-password-reset.dto';

const DUMMY_PASSWORD_HASH =
  '$2b$10$.DnJAlyzBFH.ZiGkQiy5nuQSUoaSpZzPYaAMj59yL4PEcXo/2xflW';

interface LoginResult {
  accessToken: string;
  refreshToken: string;
  user: AuthenticatedUser;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    private readonly jwtService: JwtService,
    private readonly refreshTokens: RefreshTokenService,
    private readonly usersService: UsersService,
    private readonly moduleAccess: ModuleAccessService,
    private readonly passwordResetTokens: PasswordResetTokenService,
    private readonly mail: MailService,
  ) {}

  private async toAuthenticatedUser(
    user: Omit<User, 'passwordHash'>,
  ): Promise<AuthenticatedUser> {
    const modules = await this.moduleAccess.getEffectiveModules({
      id: user.id,
      isDirector: user.isDirector,
    });

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      isDirector: user.isDirector,
      accountStatus: user.accountStatus === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE',
      mustChangePassword: user.mustChangePassword,
      modules,
    };
  }

  async getActiveUserById(id: string): Promise<AuthenticatedUser | null> {
    const user = await this.usersService.findByIdForAuth(id);

    if (!user || user.accountStatus !== 'ACTIVE') {
      return null;
    }

    return await this.toAuthenticatedUser(user);
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

    return await this.toAuthenticatedUser(user);
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
      this.logger.warn(`Failed login attempt for ${email}`);
      throw new UnauthorizedException();
    }
    this.logger.log(`User ${user.id} logged in`);

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

  async requestPasswordReset(email: string): Promise<void> {
    const user = await this.usersService.findByEmail(email);
    if (!user || user.accountStatus !== 'ACTIVE') {
      return;
    }
    const token = await this.passwordResetTokens.issue(user.id);
    await this.mail.sendPasswordReset(email, token);
  }
  async confirmPasswordReset(dto: ConfirmPasswordResetDto): Promise<void> {
    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException('Hasła nie są takie same');
    }
    const userId = await this.passwordResetTokens.consume(dto.token);
    if (!userId) {
      throw new BadRequestException('Link jest nieprawidłowy lub wygasł');
    }
    await this.usersService.setPassword(userId, dto.newPassword);
  }
}
