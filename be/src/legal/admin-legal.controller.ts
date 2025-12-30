import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { LegalService, type LegalPageDto } from './legal.service';
import { AdminUpdateLegalPageDto } from './dto/admin-update-legal-page.dto';

@Controller('admin/legal/pages')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminLegalController {
  constructor(private readonly legalService: LegalService) {}

  @Get()
  list(): Promise<LegalPageDto[]> {
    return this.legalService.listAdminPages();
  }

  @Put(':slug')
  update(
    @Param('slug') slug: string,
    @Body() dto: AdminUpdateLegalPageDto,
  ): Promise<LegalPageDto> {
    return this.legalService.updateBySlug(slug, dto);
  }
}
