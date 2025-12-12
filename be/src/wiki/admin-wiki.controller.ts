import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Patch,
  Post,
  Param,
  Put,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import type { Request } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { WikiService } from './wiki.service';
import type { WikiUploadedFile } from './wiki.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { AdminWikiListItemDto } from './dto/admin-wiki-list-item.dto';
import { AdminUpdateWikiArticleDto } from './dto/admin-update-wiki-article.dto';
import { WikiArticleDetailDto } from './dto/wiki-article-detail.dto';
import { AdminWikiArticleVersionDto } from './dto/admin-wiki-article-version.dto';
import { AdminUpdateWikiStatusDto } from './dto/admin-update-wiki-status.dto';
import { AdminCreateWikiArticleDto } from './dto/admin-create-wiki-article.dto';
import { WikiMediaItemDto } from './dto/wiki-media-item.dto';
import { AdminAutosaveWikiDraftDto } from './dto/admin-autosave-wiki-draft.dto';

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

  @Get('articles/by-slug/:slug')
  async findOneBySlug(
    @Param('slug') slug: string,
    @Query('lang') lang?: string,
  ): Promise<WikiArticleDetailDto> {
    return this.wikiService.getArticleBySlugForAdmin(slug, lang);
  }

  @Post('articles')
  async createArticle(
    @Body() dto: AdminCreateWikiArticleDto,
    @Req() req: Request & { user?: { userId: string } },
  ): Promise<WikiArticleDetailDto> {
    const userId = req.user?.userId ?? null;
    return this.wikiService.adminCreateArticle(dto, userId);
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

  @Delete('articles/:id')
  @HttpCode(204)
  async deleteArticle(@Param('id') id: string): Promise<void> {
    await this.wikiService.adminDeleteArticle(id);
  }

  @Patch('articles/:id/draft-autosave')
  @HttpCode(204)
  async autosaveDraft(
    @Param('id') id: string,
    @Body() dto: AdminAutosaveWikiDraftDto,
    @Req() req: Request & { user?: { userId: string } },
  ): Promise<void> {
    const userId = req.user?.userId ?? null;
    await this.wikiService.adminAutosaveDraft(id, dto, userId);
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

  @Delete('articles/:id/versions/:versionId')
  @HttpCode(204)
  async deleteArticleVersion(
    @Param('id') id: string,
    @Param('versionId') versionId: string,
  ): Promise<void> {
    await this.wikiService.adminDeleteArticleVersion(id, versionId);
  }

  @Get('articles/:id/media')
  async listArticleMedia(@Param('id') id: string): Promise<WikiMediaItemDto[]> {
    return this.wikiService.adminListArticleMedia(id);
  }

  @Post('articles/:id/media')
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(201)
  async uploadArticleMedia(
    @Param('id') id: string,
    @UploadedFile() file: WikiUploadedFile | undefined,
  ): Promise<WikiMediaItemDto> {
    return this.wikiService.adminUploadArticleMedia(id, file);
  }

  @Delete('articles/:id/media/:filename')
  @HttpCode(204)
  async deleteArticleMedia(
    @Param('id') id: string,
    @Param('filename') filename: string,
  ): Promise<void> {
    await this.wikiService.adminDeleteArticleMedia(id, filename);
  }
}
