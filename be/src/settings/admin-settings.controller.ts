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

type AdminSettingsResponse = {
  branding: InstanceBranding;
  features: InstanceFeatures;
  languages: InstanceLanguages;
};

@Controller('admin/settings')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminSettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  async getSettings(): Promise<AdminSettingsResponse> {
    const cfg = await this.settingsService.getOrCreateInstanceConfig();
    return {
      branding: cfg.branding,
      features: cfg.features,
      languages: cfg.languages,
    };
  }

  @Patch()
  async patchSettings(
    @Body() dto: AdminUpdateInstanceSettingsDto,
  ): Promise<AdminSettingsResponse> {
    const updated = await this.settingsService.updateInstanceConfig(dto);
    return {
      branding: updated.branding,
      features: updated.features,
      languages: updated.languages,
    };
  }
}
