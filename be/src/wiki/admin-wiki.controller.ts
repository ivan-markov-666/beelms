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
  UnauthorizedException,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import type { Request } from 'express';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { WikiService } from './wiki.service';
import type { WikiUploadedFile } from './wiki.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthorGuard } from '../auth/author.guard';
import { AdminGuard } from '../auth/admin.guard';
import { AdminWikiListItemDto } from './dto/admin-wiki-list-item.dto';
import { AdminUpdateWikiArticleDto } from './dto/admin-update-wiki-article.dto';
import { WikiArticleDetailDto } from './dto/wiki-article-detail.dto';
import { AdminWikiArticleVersionDto } from './dto/admin-wiki-article-version.dto';
import { AdminUpdateWikiStatusDto } from './dto/admin-update-wiki-status.dto';
import { AdminCreateWikiArticleDto } from './dto/admin-create-wiki-article.dto';
import { WikiMediaItemDto } from './dto/wiki-media-item.dto';
import { AdminAutosaveWikiDraftDto } from './dto/admin-autosave-wiki-draft.dto';
import { AdminBulkDeleteWikiArticlesDto } from './dto/admin-bulk-delete-wiki-articles.dto';
import { AdminBulkUpdateWikiStatusDto } from './dto/admin-bulk-update-wiki-status.dto';

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

@Controller('admin/wiki')
@UseGuards(JwtAuthGuard, AuthorGuard)
export class AdminWikiController {
  constructor(private readonly wikiService: WikiService) {}

  @Get('articles/count')
  async getCount(@Req() req: AuthenticatedRequest): Promise<{ total: number }> {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('Authenticated user not found');
    }

    const total = await this.wikiService.getAdminArticlesCount(userId);
    return { total };
  }

  @Get('articles')
  async findAll(
    @Req() req: AuthenticatedRequest,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('q') q?: string,
    @Query('lang') lang?: string,
  ): Promise<AdminWikiListItemDto[]> {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('Authenticated user not found');
    }

    const pageNum = page ? Number(page) : undefined;
    const pageSizeNum = pageSize ? Number(pageSize) : undefined;

    return this.wikiService.getAdminArticlesList(
      userId,
      pageNum,
      pageSizeNum,
      q,
      lang,
    );
  }

  @Get('articles/by-slug/:slug')
  async findOneBySlug(
    @Param('slug') slug: string,
    @Req() req: AuthenticatedRequest,
    @Query('lang') lang?: string,
  ): Promise<WikiArticleDetailDto> {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('Authenticated user not found');
    }

    return this.wikiService.getArticleBySlugForAdmin(userId, slug, lang);
  }

  @Post('articles')
  async createArticle(
    @Body() dto: AdminCreateWikiArticleDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<WikiArticleDetailDto> {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('Authenticated user not found');
    }

    return this.wikiService.adminCreateArticle(dto, userId);
  }

  @Put('articles/:id')
  async updateArticle(
    @Param('id') id: string,
    @Body() dto: AdminUpdateWikiArticleDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<WikiArticleDetailDto> {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('Authenticated user not found');
    }

    return this.wikiService.adminUpdateArticle(id, dto, userId);
  }

  @Patch('articles/:id/status')
  @HttpCode(204)
  async updateArticleStatus(
    @Param('id') id: string,
    @Body() dto: AdminUpdateWikiStatusDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<void> {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('Authenticated user not found');
    }

    await this.wikiService.adminUpdateArticleStatus(userId, id, dto.status);
  }

  @Patch('articles/status/bulk')
  @HttpCode(200)
  async bulkUpdateArticleStatus(
    @Req() req: AuthenticatedRequest,
    @Body() dto: AdminBulkUpdateWikiStatusDto,
  ): Promise<{ updated: number }> {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('Authenticated user not found');
    }

    const updated = await this.wikiService.adminBulkUpdateArticleStatus(
      userId,
      dto.ids,
      dto.status,
    );
    return { updated };
  }

  @Delete('articles/bulk')
  @HttpCode(200)
  async bulkDeleteArticles(
    @Req() req: AuthenticatedRequest,
    @Body() dto: AdminBulkDeleteWikiArticlesDto,
  ): Promise<{ deleted: number }> {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('Authenticated user not found');
    }

    const deleted = await this.wikiService.adminBulkDeleteArticles(
      userId,
      dto.ids,
    );
    return { deleted };
  }

  @Delete('articles/purge-all')
  @UseGuards(AdminGuard)
  @HttpCode(200)
  async purgeAllArticles(
    @Req() req: AuthenticatedRequest,
  ): Promise<{ deleted: number }> {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('Authenticated user not found');
    }

    const deleted = await this.wikiService.adminPurgeAllArticles(userId);
    return { deleted };
  }

  @Delete('articles/:id')
  @HttpCode(204)
  async deleteArticle(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<void> {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('Authenticated user not found');
    }

    await this.wikiService.adminDeleteArticle(userId, id);
  }

  @Patch('articles/:id/draft-autosave')
  @HttpCode(204)
  async autosaveDraft(
    @Param('id') id: string,
    @Body() dto: AdminAutosaveWikiDraftDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<void> {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('Authenticated user not found');
    }

    await this.wikiService.adminAutosaveDraft(id, dto, userId);
  }

  @Get('articles/:id/versions')
  async getArticleVersions(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<AdminWikiArticleVersionDto[]> {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('Authenticated user not found');
    }

    return this.wikiService.getArticleVersionsForAdmin(userId, id);
  }

  @Post('articles/:id/versions/:versionId/restore')
  @HttpCode(200)
  async restoreArticleVersion(
    @Param('id') id: string,
    @Param('versionId') versionId: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<WikiArticleDetailDto> {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('Authenticated user not found');
    }

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
    @Req() req: AuthenticatedRequest,
  ): Promise<void> {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('Authenticated user not found');
    }

    await this.wikiService.adminDeleteArticleVersion(userId, id, versionId);
  }

  @Get('articles/:id/media')
  async listArticleMedia(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<WikiMediaItemDto[]> {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('Authenticated user not found');
    }

    return this.wikiService.adminListArticleMedia(userId, id);
  }

  @Post('articles/:id/translations/import-markdown')
  @UseInterceptors(FilesInterceptor('files'))
  @HttpCode(200)
  async importArticleTranslationsFromMarkdown(
    @Param('id') id: string,
    @UploadedFiles() files: WikiUploadedFile[] | undefined,
    @Req() req: AuthenticatedRequest,
  ): Promise<{
    results: Array<{
      filename: string;
      language: string | null;
      status: 'created' | 'skipped' | 'error';
      versionNumber?: number;
      error?: string;
    }>;
  }> {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('Authenticated user not found');
    }

    return this.wikiService.adminImportArticleTranslationsFromMarkdownFiles(
      userId,
      id,
      files,
    );
  }

  @Post('articles/:id/translations/import-package')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 25 * 1024 * 1024,
      },
    }),
  )
  @HttpCode(200)
  async importArticleTranslationsPackage(
    @Param('id') id: string,
    @UploadedFile() file: WikiUploadedFile | undefined,
    @Req() req: AuthenticatedRequest,
  ): Promise<{
    results: Array<{
      filename: string;
      language: string | null;
      status: 'created' | 'skipped' | 'error';
      versionNumber?: number;
      warnings?: string[];
      error?: string;
    }>;
  }> {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('Authenticated user not found');
    }

    return await this.wikiService.adminImportArticleTranslationsFromPackage(
      userId,
      id,
      file,
    );
  }

  @Post('articles/:id/media')
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(201)
  async uploadArticleMedia(
    @Param('id') id: string,
    @UploadedFile() file: WikiUploadedFile | undefined,
    @Req() req: AuthenticatedRequest,
  ): Promise<WikiMediaItemDto> {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('Authenticated user not found');
    }

    return this.wikiService.adminUploadArticleMedia(userId, id, file);
  }

  @Delete('articles/:id/media/:filename')
  @HttpCode(204)
  async deleteArticleMedia(
    @Param('id') id: string,
    @Param('filename') filename: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<void> {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('Authenticated user not found');
    }

    await this.wikiService.adminDeleteArticleMedia(userId, id, filename);
  }
}
