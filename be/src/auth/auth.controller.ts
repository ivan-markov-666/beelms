import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Post,
  Query,
  Req,
  Res,
  ServiceUnavailableException,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UserProfileDto } from './dto/user-profile.dto';
import { AuthTokenDto } from './dto/auth-token.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { RateLimit } from '../security/rate-limit/rate-limit.decorator';
import { LoginProtectionInterceptor } from '../security/account-protection/login-protection.interceptor';
import { getClientIp } from '../security/account-protection/login-protection.utils';
import { FeatureEnabledGuard } from '../settings/feature-enabled.guard';
import { GoogleOAuthService } from './google-oauth.service';

@Controller('auth')
@UseGuards(FeatureEnabledGuard('auth'))
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly googleOAuthService: GoogleOAuthService,
  ) {}

  @Get('register')
  getRegister() {
    throw new HttpException(
      'Method Not Allowed',
      HttpStatus.METHOD_NOT_ALLOWED,
    );
  }

  @Post('register')
  @RateLimit({ limit: 5, windowSeconds: 3600, key: 'ip' })
  register(@Body() dto: RegisterDto): Promise<UserProfileDto> {
    return this.authService.register(dto);
  }

  @HttpCode(200)
  @Post('login')
  @RateLimit({ limit: 5, windowSeconds: 60, key: 'ip+email' })
  @UseInterceptors(LoginProtectionInterceptor)
  login(@Req() req: Request, @Body() dto: LoginDto): Promise<AuthTokenDto> {
    return this.authService.login(dto, {
      ip: getClientIp(req),
    });
  }

  @HttpCode(200)
  @Post('forgot-password')
  @RateLimit({ limit: 5, windowSeconds: 3600, key: 'ip' })
  forgotPassword(@Body() dto: ForgotPasswordDto): Promise<void> {
    return this.authService.forgotPassword(dto);
  }

  @HttpCode(200)
  @Post('reset-password')
  @RateLimit({ limit: 10, windowSeconds: 3600, key: 'ip' })
  resetPassword(@Body() dto: ResetPasswordDto): Promise<void> {
    return this.authService.resetPassword(dto);
  }

  @HttpCode(200)
  @Post('verify-email')
  verifyEmail(@Body() dto: VerifyEmailDto): Promise<void> {
    return this.authService.verifyEmail(dto);
  }

  @Get('google/authorize')
  googleAuthorize(@Query('redirectPath') redirectPath?: string): {
    url: string;
    state: string;
  } {
    if (!this.googleOAuthService.isConfigured()) {
      throw new ServiceUnavailableException('Google login is not available');
    }

    return this.googleOAuthService.createAuthorizationUrl(redirectPath);
  }

  @Get('google/callback')
  async googleCallback(
    @Query('code') code: string | undefined,
    @Query('state') state: string | undefined,
    @Query('error') error: string | undefined,
    @Res() res: Response,
  ): Promise<void> {
    const fallbackRedirect =
      this.googleOAuthService.extractRedirectPathFromState(state);

    if (!this.googleOAuthService.isConfigured()) {
      res.redirect(
        this.googleOAuthService.buildFrontendRedirectUrl({
          provider: 'google',
          redirectPath: fallbackRedirect,
          error: 'google_unavailable',
        }),
      );
      return;
    }

    if (error || !code) {
      res.redirect(
        this.googleOAuthService.buildFrontendRedirectUrl({
          provider: 'google',
          redirectPath: fallbackRedirect,
          error: error ?? 'missing_code',
        }),
      );
      return;
    }

    try {
      const profile = await this.googleOAuthService.exchangeCodeForProfile(
        code,
        state ?? '',
      );
      const token = await this.authService.loginWithGoogle(profile);

      res.redirect(
        this.googleOAuthService.buildFrontendRedirectUrl({
          provider: 'google',
          redirectPath: profile.redirectPath,
          token: token.accessToken,
        }),
      );
    } catch {
      res.redirect(
        this.googleOAuthService.buildFrontendRedirectUrl({
          provider: 'google',
          redirectPath: fallbackRedirect,
          error: 'google_oauth_failed',
        }),
      );
    }
  }
}
