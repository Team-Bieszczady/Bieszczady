import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { type CookieOptions, type Request, type Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';
import { REFRESH_TOKEN_TTL_DAYS } from './refresh-token.service';
import { type AuthenticatedUser, type AuthResponse } from './types/auth.types';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { ThrottlerGuard } from '@nestjs/throttler';

const REFRESH_COOKIE = 'refresh_token';
const REFRESH_COOKIE_PATH = '/api/v1/auth';

function refreshCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV !== 'development',
    sameSite: 'strict',
    path: REFRESH_COOKIE_PATH,
    maxAge: REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
  };
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(ThrottlerGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponse> {
    const { accessToken, refreshToken, user } = await this.authService.login(
      dto.email,
      dto.password,
    );

    res.cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions());

    return { accessToken, user };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponse> {
    const cookies = req.cookies as Record<string, string | undefined>;
    const token = cookies?.[REFRESH_COOKIE];

    if (!token) {
      throw new UnauthorizedException();
    }

    const { accessToken, refreshToken, user } =
      await this.authService.refresh(token);

    res.cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions());

    return { accessToken, user };
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  logout(@Req() req: Request, @Res({ passthrough: true }) res: Response): void {
    const cookies = req.cookies as Record<string, string | undefined>;
    const token = cookies?.[REFRESH_COOKIE];

    if (token) {
      this.authService.logout(token);
    }

    res.clearCookie(REFRESH_COOKIE, refreshCookieOptions());
  }

  @UseGuards(ThrottlerGuard)
  @Post('password-reset/request')
  @HttpCode(HttpStatus.OK)
  async requestPasswordReset(
    @Body() dto: RequestPasswordResetDto,
  ): Promise<{ message: string }> {
    await this.authService.requestPasswordReset(dto.email);
    return { message: 'Jeśli konto istnieje, wysłaliśmy link do resetu hasła' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@CurrentUser() user: AuthenticatedUser): AuthenticatedUser {
    return user;
  }
}
