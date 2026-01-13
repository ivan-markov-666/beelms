import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { AccountService } from './account.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { UserProfileDto } from './dto/user-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { AccountExportRequestDto } from './dto/account-export-request.dto';
import { UserExportDto } from './dto/user-export.dto';
import { Enable2faDto } from './dto/enable-2fa.dto';
import { Disable2faDto } from './dto/disable-2fa.dto';
import { RateLimit } from '../security/rate-limit/rate-limit.decorator';
import { CaptchaService } from '../security/captcha/captcha.service';
import { FeatureEnabledGuard } from '../settings/feature-enabled.guard';
import { SettingsService } from '../settings/settings.service';

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

@Controller('users')
export class AccountController {
  constructor(
    private readonly accountService: AccountService,
    private readonly captchaService: CaptchaService,
    private readonly settingsService: SettingsService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@Req() req: AuthenticatedRequest): Promise<UserProfileDto> {
    if (!req.user) {
      // JwtAuthGuard гарантира, че при липса или невалиден токен заявката няма да стигне дотук.
      throw new Error('Authenticated user not found in request context');
    }

    return this.accountService.getCurrentProfile(req.user.userId);
  }

  @UseGuards(FeatureEnabledGuard('profile'), JwtAuthGuard)
  @Patch('me')
  updateMe(
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdateProfileDto,
  ): Promise<UserProfileDto> {
    if (!req.user) {
      throw new Error('Authenticated user not found in request context');
    }

    return this.accountService.updateEmail(req.user.userId, dto);
  }

  @UseGuards(FeatureEnabledGuard('profile'), JwtAuthGuard)
  @Post('me/change-password')
  @RateLimit({ limit: 10, windowSeconds: 3600, key: 'userId' })
  @HttpCode(204)
  async changePassword(
    @Req() req: AuthenticatedRequest,
    @Body() dto: ChangePasswordDto,
  ): Promise<void> {
    if (!req.user) {
      throw new Error('Authenticated user not found in request context');
    }

    const cfg = await this.settingsService.getOrCreateInstanceConfig();
    const features = cfg.features;
    const requireCaptcha =
      features?.captcha === true && features?.captchaChangePassword === true;
    if (requireCaptcha) {
      await this.captchaService.verifyCaptchaToken({
        token: dto.captchaToken ?? '',
        remoteIp: req.ip,
      });
    }

    await this.accountService.changePassword(
      req.user.userId,
      dto.currentPassword,
      dto.newPassword,
    );
  }

  @UseGuards(FeatureEnabledGuard('gdprLegal'), JwtAuthGuard)
  @Delete('me')
  @RateLimit({ limit: 3, windowSeconds: 86400, key: 'userId' })
  @HttpCode(204)
  async deleteMe(@Req() req: AuthenticatedRequest): Promise<void> {
    if (!req.user) {
      throw new Error('Authenticated user not found in request context');
    }

    await this.accountService.deleteAccount(req.user.userId);
  }

  @UseGuards(FeatureEnabledGuard('gdprLegal'), JwtAuthGuard)
  @Post('me/export')
  @RateLimit({ limit: 5, windowSeconds: 86400, key: 'userId' })
  @HttpCode(200)
  async exportMe(
    @Req() req: AuthenticatedRequest,
    @Body() dto: AccountExportRequestDto,
  ): Promise<UserExportDto> {
    if (!req.user) {
      throw new Error('Authenticated user not found in request context');
    }

    const requireCaptcha =
      process.env.ACCOUNT_EXPORT_REQUIRE_CAPTCHA === 'true';
    if (requireCaptcha) {
      const token = dto.captchaToken ?? '';
      if (token.trim().length === 0) {
        throw new BadRequestException('captcha verification required');
      }

      await this.captchaService.verifyCaptchaToken({
        token,
        remoteIp: req.ip,
      });
    }

    return this.accountService.exportData(req.user.userId);
  }

  @UseGuards(FeatureEnabledGuard('auth2fa'), JwtAuthGuard)
  @Get('me/2fa/status')
  getTwoFactorStatus(@Req() req: AuthenticatedRequest): Promise<{
    enabled: boolean;
    confirmedAt: string | null;
  }> {
    if (!req.user) {
      throw new Error('Authenticated user not found in request context');
    }

    return this.accountService.getTwoFactorStatus(req.user.userId);
  }

  @UseGuards(FeatureEnabledGuard('auth2fa'), JwtAuthGuard)
  @Post('me/2fa/setup')
  setupTwoFactor(@Req() req: AuthenticatedRequest): Promise<{
    secret: string;
    otpauthUrl: string;
  }> {
    if (!req.user) {
      throw new Error('Authenticated user not found in request context');
    }

    return this.accountService.setupTwoFactor(req.user.userId);
  }

  @UseGuards(FeatureEnabledGuard('auth2fa'), JwtAuthGuard)
  @Post('me/2fa/enable')
  enableTwoFactor(
    @Req() req: AuthenticatedRequest,
    @Body() dto: Enable2faDto,
  ): Promise<{ enabled: boolean; confirmedAt: string }> {
    if (!req.user) {
      throw new Error('Authenticated user not found in request context');
    }

    return this.accountService.enableTwoFactor(req.user.userId, dto);
  }

  @UseGuards(FeatureEnabledGuard('auth2fa'), JwtAuthGuard)
  @Post('me/2fa/disable')
  disableTwoFactor(
    @Req() req: AuthenticatedRequest,
    @Body() dto: Disable2faDto,
  ): Promise<{ enabled: boolean }> {
    if (!req.user) {
      throw new Error('Authenticated user not found in request context');
    }

    return this.accountService.disableTwoFactor(req.user.userId, dto);
  }
}
