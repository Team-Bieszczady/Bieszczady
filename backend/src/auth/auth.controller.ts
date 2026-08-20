import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { type CookieOptions, type Request, type Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { REFRESH_TOKEN_TTL_DAYS } from './refresh-token.service';
import { type AuthResponse } from './types/auth.types';

const REFRESH_COOKIE = 'refresh_token';

function refreshCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV !== 'development',
    sameSite: 'strict',
    path: '/api/v1/auth/refresh',
    maxAge: REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
  };
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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
}
