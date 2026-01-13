import {
  Controller,
  Get,
  NotFoundException,
  Query,
  UseGuards,
} from '@nestjs/common';
import { FeatureEnabledGuard } from '../settings/feature-enabled.guard';
import { SettingsService } from '../settings/settings.service';
import { LegalService, type LegalPageDto } from './legal.service';

@Controller('legal')
export class LegalController {
  constructor(
    private readonly legalService: LegalService,
    private readonly settingsService: SettingsService,
  ) {}

  private async ensureUrlEnabled(slug: string): Promise<void> {
    const ok = await this.settingsService.isBrandingPageUrlEnabled(slug);
    if (!ok) {
      throw new NotFoundException('Page disabled');
    }
  }

  @UseGuards(FeatureEnabledGuard('gdprLegal'), FeatureEnabledGuard('pageTerms'))
  @Get('terms')
  async getTerms(@Query('lang') lang?: string): Promise<LegalPageDto> {
    await this.ensureUrlEnabled('terms');
    return this.legalService.getBySlug('terms', lang);
  }

  @UseGuards(
    FeatureEnabledGuard('gdprLegal'),
    FeatureEnabledGuard('pagePrivacy'),
  )
  @Get('privacy')
  async getPrivacy(@Query('lang') lang?: string): Promise<LegalPageDto> {
    await this.ensureUrlEnabled('privacy');
    return this.legalService.getBySlug('privacy', lang);
  }

  @UseGuards(
    FeatureEnabledGuard('gdprLegal'),
    FeatureEnabledGuard('pageCookiePolicy'),
  )
  @Get('cookie-policy')
  async getCookiePolicy(@Query('lang') lang?: string): Promise<LegalPageDto> {
    await this.ensureUrlEnabled('cookie-policy');
    return this.legalService.getBySlug('cookie-policy', lang);
  }

  @UseGuards(
    FeatureEnabledGuard('gdprLegal'),
    FeatureEnabledGuard('pageImprint'),
  )
  @Get('imprint')
  async getImprint(@Query('lang') lang?: string): Promise<LegalPageDto> {
    await this.ensureUrlEnabled('imprint');
    return this.legalService.getBySlug('imprint', lang);
  }

  @UseGuards(
    FeatureEnabledGuard('gdprLegal'),
    FeatureEnabledGuard('pageAccessibility'),
  )
  @Get('accessibility')
  async getAccessibility(@Query('lang') lang?: string): Promise<LegalPageDto> {
    await this.ensureUrlEnabled('accessibility');
    return this.legalService.getBySlug('accessibility', lang);
  }
}
