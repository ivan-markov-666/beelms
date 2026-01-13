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

@Controller('pages')
export class PagesController {
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

  @Get('about')
  async getAbout(@Query('lang') lang?: string): Promise<LegalPageDto> {
    await this.ensureUrlEnabled('about');
    return this.legalService.getBySlug('about', lang);
  }

  @UseGuards(FeatureEnabledGuard('pageContact'))
  @Get('contact')
  async getContact(@Query('lang') lang?: string): Promise<LegalPageDto> {
    await this.ensureUrlEnabled('contact');
    return this.legalService.getBySlug('contact', lang);
  }

  @UseGuards(FeatureEnabledGuard('pageFaq'))
  @Get('faq')
  async getFaq(@Query('lang') lang?: string): Promise<LegalPageDto> {
    await this.ensureUrlEnabled('faq');
    return this.legalService.getBySlug('faq', lang);
  }

  @UseGuards(FeatureEnabledGuard('pageSupport'))
  @Get('support')
  async getSupport(@Query('lang') lang?: string): Promise<LegalPageDto> {
    await this.ensureUrlEnabled('support');
    return this.legalService.getBySlug('support', lang);
  }
}
