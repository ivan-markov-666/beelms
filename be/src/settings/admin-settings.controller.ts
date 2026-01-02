import {
  Body,
  Controller,
  Get,
  Param,
  ParseEnumPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { SettingsService } from './settings.service';
import { AdminUpdateInstanceSettingsDto } from './dto/admin-update-instance-settings.dto';
import type {
  InstanceBranding,
  InstanceFeatures,
  InstanceLanguages,
  SocialProviderName,
} from './instance-config.entity';
import {
  SocialLoginAvailabilityService,
  type SocialProviderStatus,
} from '../auth/social-login-availability.service';
import { SocialProviderDiagnosticsService } from './social-provider-diagnostics.service';
import type { SocialProviderTestResult } from './social-provider-diagnostics.service';

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

type AdminSettingsResponse = {
  branding: InstanceBranding;
  features: InstanceFeatures;
  languages: InstanceLanguages;
  socialProviders: Record<SocialProviderName, SocialProviderStatus>;
  socialCredentials: Partial<
    Record<
      SocialProviderName,
      {
        clientId: string | null;
        redirectUri: string | null;
        hasClientSecret: boolean;
        notes: string | null;
        updatedBy: string | null;
        updatedAt: string | null;
      }
    >
  >;
};

const SOCIAL_PROVIDER_PARAM = {
  google: 'google',
  facebook: 'facebook',
  github: 'github',
  linkedin: 'linkedin',
} as const satisfies Record<string, SocialProviderName>;

@Controller('admin/settings')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminSettingsController {
  constructor(
    private readonly settingsService: SettingsService,
    private readonly socialAvailability: SocialLoginAvailabilityService,
    private readonly socialDiagnostics: SocialProviderDiagnosticsService,
  ) {}

  @Get()
  async getSettings(): Promise<AdminSettingsResponse> {
    const cfg = await this.settingsService.getOrCreateInstanceConfig();
    const socialProviders = await this.socialAvailability.getProviderStatuses(
      cfg.features,
    );
    const socialCredentials =
      await this.settingsService.getSanitizedSocialCredentials();

    return {
      branding: cfg.branding,
      features: cfg.features,
      languages: cfg.languages,
      socialProviders,
      socialCredentials,
    };
  }

  @Patch()
  async patchSettings(
    @Body() dto: AdminUpdateInstanceSettingsDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<AdminSettingsResponse> {
    const updated = await this.settingsService.updateInstanceConfig(dto, {
      updatedBy: req.user?.email ?? req.user?.userId ?? null,
    });
    const socialProviders = await this.socialAvailability.getProviderStatuses(
      updated.features,
    );
    const socialCredentials =
      await this.settingsService.getSanitizedSocialCredentials();

    return {
      branding: updated.branding,
      features: updated.features,
      languages: updated.languages,
      socialProviders,
      socialCredentials,
    };
  }

  @Post('social/:provider/test')
  async testSocialProvider(
    @Param('provider', new ParseEnumPipe(SOCIAL_PROVIDER_PARAM))
    provider: SocialProviderName,
  ): Promise<SocialProviderTestResult> {
    return this.socialDiagnostics.testConnection(provider);
  }
}
