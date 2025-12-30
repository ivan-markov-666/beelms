import { Controller, Get, Header } from '@nestjs/common';
import { SettingsService } from './settings.service';

@Controller('public/settings')
export class PublicSettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @Header('Cache-Control', 'public, max-age=60')
  async getPublicSettings() {
    const cfg = await this.settingsService.getOrCreateInstanceConfig();

    return {
      branding: cfg.branding,
      features: cfg.features,
      languages: cfg.languages,
    };
  }
}
