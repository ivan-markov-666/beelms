import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { WikiService } from './wiki.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { AdminWikiListItemDto } from './dto/admin-wiki-list-item.dto';

@Controller('admin/wiki')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminWikiController {
  constructor(private readonly wikiService: WikiService) {}

  @Get('articles')
  async findAll(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('q') q?: string,
    @Query('lang') lang?: string,
  ): Promise<AdminWikiListItemDto[]> {
    const pageNum = page ? Number(page) : undefined;
    const pageSizeNum = pageSize ? Number(pageSize) : undefined;

    return this.wikiService.getAdminArticlesList(
      pageNum,
      pageSizeNum,
      q,
      lang,
    );
  }
}
