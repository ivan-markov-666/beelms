import { Controller, Get, UseGuards } from '@nestjs/common';
import { FeatureEnabledGuard } from '../settings/feature-enabled.guard';
import { LegalService, type LegalPageDto } from './legal.service';

@Controller('legal')
@UseGuards(FeatureEnabledGuard('gdprLegal'))
export class LegalController {
  constructor(private readonly legalService: LegalService) {}

  @Get('terms')
  getTerms(): Promise<LegalPageDto> {
    return this.legalService.getBySlug('terms');
  }

  @Get('privacy')
  getPrivacy(): Promise<LegalPageDto> {
    return this.legalService.getBySlug('privacy');
  }
}
