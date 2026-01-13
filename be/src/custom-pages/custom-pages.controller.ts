import { Controller, Get, Param, Query } from '@nestjs/common';
import { CustomPagesService } from './custom-pages.service';

@Controller('pages/custom')
export class CustomPagesController {
  constructor(private readonly customPagesService: CustomPagesService) {}

  @Get()
  list(@Query('lang') lang?: string) {
    return this.customPagesService.publicList(lang);
  }

  @Get(':slug')
  getBySlug(@Param('slug') slug: string, @Query('lang') lang?: string) {
    return this.customPagesService.publicGetBySlug(slug, lang);
  }
}
