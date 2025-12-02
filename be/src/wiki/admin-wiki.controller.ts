import {
  Body,
  Controller,
  Get,
  Param,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { WikiService } from './wiki.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { AdminWikiListItemDto } from './dto/admin-wiki-list-item.dto';
import { AdminUpdateWikiArticleDto } from './dto/admin-update-wiki-article.dto';
import { WikiArticleDetailDto } from './dto/wiki-article-detail.dto';

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

    return this.wikiService.getAdminArticlesList(pageNum, pageSizeNum, q, lang);
  }

  @Put('articles/:id')
  async updateArticle(
    @Param('id') id: string,
    @Body() dto: AdminUpdateWikiArticleDto,
    @Req() req: Request & { user?: { userId: string } },
  ): Promise<WikiArticleDetailDto> {
    const userId = req.user?.userId ?? null;
    return this.wikiService.adminUpdateArticle(id, dto, userId);
  }
}
