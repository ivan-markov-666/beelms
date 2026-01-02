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
import { GoogleOAuthService } from './google-oauth.service';
import { FacebookOAuthService } from './facebook-oauth.service';
import { GithubOAuthService } from './github-oauth.service';
import { LinkedinOAuthService } from './linkedin-oauth.service';
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
import { SocialLoginAvailabilityService } from './social-login-availability.service';

@Controller('auth')
@UseGuards(FeatureEnabledGuard('auth'))
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly googleOAuthService: GoogleOAuthService,
    private readonly facebookOAuthService: FacebookOAuthService,
    private readonly githubOAuthService: GithubOAuthService,
    private readonly linkedinOAuthService: LinkedinOAuthService,
    private readonly socialLoginAvailability: SocialLoginAvailabilityService,
  ) {}

  @Get('register')
  getRegister() {
    throw new HttpException(
      'Method Not Allowed',
      HttpStatus.METHOD_NOT_ALLOWED,
    );
  }

  @Get('facebook/authorize')
  async facebookAuthorize(
    @Query('redirectPath') redirectPath?: string,
  ): Promise<{
    url: string;
    state: string;
  }> {
    await this.socialLoginAvailability.ensureEnabled('facebook');
    if (!(await this.facebookOAuthService.isConfigured())) {
      throw new ServiceUnavailableException('Facebook login is not available');
    }

    return this.facebookOAuthService.createAuthorizationUrl(redirectPath);
  }

  @Get('facebook/callback')
  async facebookCallback(
    @Query('code') code: string | undefined,
    @Query('state') state: string | undefined,
    @Query('error') error: string | undefined,
    @Res() res: Response,
  ): Promise<void> {
    const fallbackRedirect =
      this.facebookOAuthService.extractRedirectPathFromState(state);

    const enabled = await this.socialLoginAvailability.isEnabled('facebook');
    if (!enabled) {
      res.redirect(
        this.facebookOAuthService.buildFrontendRedirectUrl({
          redirectPath: fallbackRedirect,
          error: 'facebook_disabled',
        }),
      );
      return;
    }

    const facebookConfigured = await this.facebookOAuthService.isConfigured();
    if (!facebookConfigured) {
      res.redirect(
        this.facebookOAuthService.buildFrontendRedirectUrl({
          redirectPath: fallbackRedirect,
          error: 'facebook_unavailable',
        }),
      );
      return;
    }

    if (error || !code) {
      res.redirect(
        this.facebookOAuthService.buildFrontendRedirectUrl({
          redirectPath: fallbackRedirect,
          error: error ?? 'missing_code',
        }),
      );
      return;
    }

    try {
      const profile = await this.facebookOAuthService.exchangeCodeForProfile(
        code,
        state ?? '',
      );
      const token = await this.authService.loginWithFacebook(profile);

      res.redirect(
        this.facebookOAuthService.buildFrontendRedirectUrl({
          redirectPath: profile.redirectPath,
          token: token.accessToken,
        }),
      );
    } catch {
      res.redirect(
        this.facebookOAuthService.buildFrontendRedirectUrl({
          redirectPath: fallbackRedirect,
          error: 'facebook_oauth_failed',
        }),
      );
    }
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
  async googleAuthorize(@Query('redirectPath') redirectPath?: string): Promise<{
    url: string;
    state: string;
  }> {
    await this.socialLoginAvailability.ensureEnabled('google');
    if (!(await this.googleOAuthService.isConfigured())) {
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

    const enabled = await this.socialLoginAvailability.isEnabled('google');
    if (!enabled) {
      res.redirect(
        this.googleOAuthService.buildFrontendRedirectUrl({
          provider: 'google',
          redirectPath: fallbackRedirect,
          error: 'google_disabled',
        }),
      );
      return;
    }

    const googleConfigured = await this.googleOAuthService.isConfigured();
    if (!googleConfigured) {
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

  @Get('github/authorize')
  async githubAuthorize(@Query('redirectPath') redirectPath?: string): Promise<{
    url: string;
    state: string;
  }> {
    await this.socialLoginAvailability.ensureEnabled('github');
    if (!(await this.githubOAuthService.isConfigured())) {
      throw new ServiceUnavailableException('GitHub login is not available');
    }

    return this.githubOAuthService.createAuthorizationUrl(redirectPath);
  }

  @Get('github/callback')
  async githubCallback(
    @Query('code') code: string | undefined,
    @Query('state') state: string | undefined,
    @Query('error') error: string | undefined,
    @Res() res: Response,
  ): Promise<void> {
    const fallbackRedirect =
      this.githubOAuthService.extractRedirectPathFromState(state);

    const enabled = await this.socialLoginAvailability.isEnabled('github');
    if (!enabled) {
      res.redirect(
        this.githubOAuthService.buildFrontendRedirectUrl({
          redirectPath: fallbackRedirect,
          error: 'github_disabled',
        }),
      );
      return;
    }

    const githubConfigured = await this.githubOAuthService.isConfigured();
    if (!githubConfigured) {
      res.redirect(
        this.githubOAuthService.buildFrontendRedirectUrl({
          redirectPath: fallbackRedirect,
          error: 'github_unavailable',
        }),
      );
      return;
    }

    if (error || !code) {
      res.redirect(
        this.githubOAuthService.buildFrontendRedirectUrl({
          redirectPath: fallbackRedirect,
          error: error ?? 'missing_code',
        }),
      );
      return;
    }

    try {
      const profile = await this.githubOAuthService.exchangeCodeForProfile(
        code,
        state ?? '',
      );
      const token = await this.authService.loginWithGithub(profile);

      res.redirect(
        this.githubOAuthService.buildFrontendRedirectUrl({
          redirectPath: profile.redirectPath,
          token: token.accessToken,
        }),
      );
    } catch {
      res.redirect(
        this.githubOAuthService.buildFrontendRedirectUrl({
          redirectPath: fallbackRedirect,
          error: 'github_oauth_failed',
        }),
      );
    }
  }

  @Get('linkedin/authorize')
  async linkedinAuthorize(
    @Query('redirectPath') redirectPath?: string,
  ): Promise<{
    url: string;
    state: string;
  }> {
    await this.socialLoginAvailability.ensureEnabled('linkedin');
    if (!(await this.linkedinOAuthService.isConfigured())) {
      throw new ServiceUnavailableException('LinkedIn login is not available');
    }

    return this.linkedinOAuthService.createAuthorizationUrl(redirectPath);
  }

  @Get('linkedin/callback')
  async linkedinCallback(
    @Query('code') code: string | undefined,
    @Query('state') state: string | undefined,
    @Query('error') error: string | undefined,
    @Res() res: Response,
  ): Promise<void> {
    const fallbackRedirect =
      this.linkedinOAuthService.extractRedirectPathFromState(state);

    const enabled = await this.socialLoginAvailability.isEnabled('linkedin');
    if (!enabled) {
      res.redirect(
        this.linkedinOAuthService.buildFrontendRedirectUrl({
          redirectPath: fallbackRedirect,
          error: 'linkedin_disabled',
        }),
      );
      return;
    }

    const linkedinConfigured = await this.linkedinOAuthService.isConfigured();
    if (!linkedinConfigured) {
      res.redirect(
        this.linkedinOAuthService.buildFrontendRedirectUrl({
          redirectPath: fallbackRedirect,
          error: 'linkedin_unavailable',
        }),
      );
      return;
    }

    if (error || !code) {
      res.redirect(
        this.linkedinOAuthService.buildFrontendRedirectUrl({
          redirectPath: fallbackRedirect,
          error: error ?? 'missing_code',
        }),
      );
      return;
    }

    try {
      const profile = await this.linkedinOAuthService.exchangeCodeForProfile(
        code,
        state ?? '',
      );
      const token = await this.authService.loginWithLinkedin(profile);

      res.redirect(
        this.linkedinOAuthService.buildFrontendRedirectUrl({
          redirectPath: profile.redirectPath,
          token: token.accessToken,
        }),
      );
    } catch {
      res.redirect(
        this.linkedinOAuthService.buildFrontendRedirectUrl({
          redirectPath: fallbackRedirect,
          error: 'linkedin_oauth_failed',
        }),
      );
    }
  }
}
