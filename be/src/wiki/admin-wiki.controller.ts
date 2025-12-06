import {
  Body,
  Controller,
  Get,
  HttpCode,
  Patch,
  Post,
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
import { AdminWikiArticleVersionDto } from './dto/admin-wiki-article-version.dto';
import { AdminUpdateWikiStatusDto } from './dto/admin-update-wiki-status.dto';

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

  @Patch('articles/:id/status')
  @HttpCode(204)
  async updateArticleStatus(
    @Param('id') id: string,
    @Body() dto: AdminUpdateWikiStatusDto,
  ): Promise<void> {
    await this.wikiService.adminUpdateArticleStatus(id, dto.status);
  }

  @Get('articles/:id/versions')
  async getArticleVersions(
    @Param('id') id: string,
  ): Promise<AdminWikiArticleVersionDto[]> {
    return this.wikiService.getArticleVersionsForAdmin(id);
  }

  @Post('articles/:id/versions/:versionId/restore')
  @HttpCode(200)
  async restoreArticleVersion(
    @Param('id') id: string,
    @Param('versionId') versionId: string,
    @Req() req: Request & { user?: { userId: string } },
  ): Promise<WikiArticleDetailDto> {
    const userId = req.user?.userId ?? null;
    return this.wikiService.restoreArticleVersionForAdmin(
      id,
      versionId,
      userId,
    );
  }
}
