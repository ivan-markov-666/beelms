import { Controller, Get, Header } from '@nestjs/common';
import { SettingsService } from './settings.service';

@Controller('public/settings')
export class PublicSettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @Header('Cache-Control', 'no-store')
  async getPublicSettings() {
    const cfg = await this.settingsService.getOrCreateInstanceConfig();

    const branding = { ...cfg.branding } as Record<string, unknown>;

    const socialImage = cfg.branding.socialImage;
    const socialDescription = cfg.branding.socialDescription;
    const openGraph = cfg.branding.openGraph;
    const twitter = cfg.branding.twitter;

    const hasAnySocialMetadata =
      socialImage != null ||
      socialDescription != null ||
      openGraph != null ||
      twitter != null;

    if (!hasAnySocialMetadata) {
      branding.socialImage = null;
      branding.socialDescription = null;
      branding.openGraph = null;
      branding.twitter = null;
    } else {
      if (socialImage != null) {
        branding.socialImage = socialImage;
      } else {
        delete branding.socialImage;
      }

      if (socialDescription != null) {
        branding.socialDescription = socialDescription;
      } else {
        delete branding.socialDescription;
      }

      if (openGraph != null) {
        branding.openGraph = openGraph;
      } else {
        delete branding.openGraph;
      }

      if (twitter != null) {
        branding.twitter = twitter;
      } else {
        delete branding.twitter;
      }
    }

    return {
      branding,
      features: (() => {
        const f = { ...cfg.features } as Record<string, unknown>;
        delete f.infraRedisUrl;
        delete f.infraRabbitmqUrl;
        delete f.infraMonitoringUrl;
        delete f.infraErrorTrackingUrl;
        return f;
      })(),
      languages: cfg.languages,
      seo: cfg.features?.seo !== false ? (cfg.seo ?? null) : null,
    };
  }
}
