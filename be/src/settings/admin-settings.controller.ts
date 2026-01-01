import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { SettingsService } from './settings.service';
import { AdminUpdateInstanceSettingsDto } from './dto/admin-update-instance-settings.dto';
import type {
  InstanceBranding,
  InstanceFeatures,
  InstanceLanguages,
} from './instance-config.entity';
import {
  SocialLoginAvailabilityService,
  type SocialProviderStatus,
} from '../auth/social-login-availability.service';
import type { SocialProvider } from '../auth/social-oauth-state.service';

type AdminSettingsResponse = {
  branding: InstanceBranding;
  features: InstanceFeatures;
  languages: InstanceLanguages;
  socialProviders: Record<SocialProvider, SocialProviderStatus>;
};

@Controller('admin/settings')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminSettingsController {
  constructor(
    private readonly settingsService: SettingsService,
    private readonly socialAvailability: SocialLoginAvailabilityService,
  ) {}

  @Get()
  async getSettings(): Promise<AdminSettingsResponse> {
    const cfg = await this.settingsService.getOrCreateInstanceConfig();
    const socialProviders = await this.socialAvailability.getProviderStatuses(
      cfg.features,
    );

    return {
      branding: cfg.branding,
      features: cfg.features,
      languages: cfg.languages,
      socialProviders,
    };
  }

  @Patch()
  async patchSettings(
    @Body() dto: AdminUpdateInstanceSettingsDto,
  ): Promise<AdminSettingsResponse> {
    const updated = await this.settingsService.updateInstanceConfig(dto);
    const socialProviders = await this.socialAvailability.getProviderStatuses(
      updated.features,
    );

    return {
      branding: updated.branding,
      features: updated.features,
      languages: updated.languages,
      socialProviders,
    };
  }
}
