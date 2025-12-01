import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WikiArticle } from './wiki-article.entity';
import { WikiArticleVersion } from './wiki-article-version.entity';
import { WikiListItemDto } from './dto/wiki-list-item.dto';
import { AdminWikiListItemDto } from './dto/admin-wiki-list-item.dto';
import { WikiArticleDetailDto } from './dto/wiki-article-detail.dto';

@Injectable()
export class WikiService {
  constructor(
    @InjectRepository(WikiArticle)
    private readonly articleRepo: Repository<WikiArticle>,
    @InjectRepository(WikiArticleVersion)
    private readonly versionRepo: Repository<WikiArticleVersion>,
  ) {}

  async getActiveArticlesList(
    page?: number,
    pageSize?: number,
    q?: string,
    lang?: string,
  ): Promise<WikiListItemDto[]> {
    const safePage = page && page > 0 ? page : 1;
    const safePageSize = pageSize && pageSize > 0 ? pageSize : 20;
    const skip = (safePage - 1) * safePageSize;
    const take = safePageSize;

    const articles = await this.articleRepo.find({
      where: { status: 'active' },
      relations: ['versions'],
      order: { updatedAt: 'DESC' },
      skip,
      take,
    });

    const items: WikiListItemDto[] = [];

    for (const article of articles) {
      const published = (article.versions ?? []).filter((v) => v.isPublished);
      if (!published.length) {
        continue;
      }

      let candidates = published;

      const trimmedQ = q?.trim();
      const hasSearch = !!trimmedQ;
      const hasLangFilter = !!lang;

      if (hasLangFilter) {
        candidates = candidates.filter((v) => v.language === lang);
      }

      if (hasSearch && trimmedQ) {
        const lowerQ = trimmedQ.toLowerCase();
        candidates = candidates.filter((v) =>
          (v.title ?? '').toLowerCase().includes(lowerQ),
        );
      }

      if (!candidates.length) {
        continue;
      }

      candidates.sort((a, b) => {
        const aTime = a.createdAt ? a.createdAt.getTime() : 0;
        const bTime = b.createdAt ? b.createdAt.getTime() : 0;
        return aTime - bTime;
      });

      const latest = candidates[candidates.length - 1];
      const updatedAt =
        latest.createdAt ??
        article.updatedAt ??
        article.createdAt ??
        new Date();

      items.push({
        id: article.id,
        slug: article.slug,
        language: latest.language,
        title: latest.title,
        updatedAt: updatedAt.toISOString(),
      });
    }

    return items;
  }

  async getAdminArticlesList(
    page?: number,
    pageSize?: number,
    q?: string,
    lang?: string,
  ): Promise<AdminWikiListItemDto[]> {
    const safePage = page && page > 0 ? page : 1;
    const safePageSize = pageSize && pageSize > 0 ? pageSize : 20;
    const skip = (safePage - 1) * safePageSize;
    const take = safePageSize;

    const articles = await this.articleRepo.find({
      relations: ['versions'],
      order: { updatedAt: 'DESC' },
      skip,
      take,
    });

    const items: AdminWikiListItemDto[] = [];

    for (const article of articles) {
      const versions = article.versions ?? [];
      if (!versions.length) {
        continue;
      }

      let candidates = versions;

      const trimmedQ = q?.trim();
      const hasSearch = !!trimmedQ;
      const hasLangFilter = !!lang;

      if (hasLangFilter) {
        candidates = candidates.filter((v) => v.language === lang);
      }

      if (hasSearch && trimmedQ) {
        const lowerQ = trimmedQ.toLowerCase();
        candidates = candidates.filter((v) =>
          (v.title ?? '').toLowerCase().includes(lowerQ),
        );
      }

      if (!candidates.length) {
        continue;
      }

      candidates.sort((a, b) => {
        const aTime = a.createdAt ? a.createdAt.getTime() : 0;
        const bTime = b.createdAt ? b.createdAt.getTime() : 0;
        return aTime - bTime;
      });

      const latest = candidates[candidates.length - 1];
      const updatedAt =
        latest.createdAt ??
        article.updatedAt ??
        article.createdAt ??
        new Date();

      items.push({
        id: article.id,
        slug: article.slug,
        title: latest.title,
        status: article.status,
        updatedAt: updatedAt.toISOString(),
      });
    }

    return items;
  }

  async getArticleBySlug(
    slug: string,
    lang?: string,
  ): Promise<WikiArticleDetailDto> {
    const article = await this.articleRepo.findOne({
      where: { slug, status: 'active' },
      relations: ['versions'],
    });

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    const published = (article.versions ?? []).filter((v) => v.isPublished);
    if (!published.length) {
      throw new NotFoundException('Article not found');
    }

    let candidates = published;

    if (lang) {
      candidates = published.filter((v) => v.language === lang);
    } else {
      const defaultLang = 'bg';
      const defaultCandidates = published.filter(
        (v) => v.language === defaultLang,
      );
      if (defaultCandidates.length) {
        candidates = defaultCandidates;
      }
    }

    if (!candidates.length) {
      throw new NotFoundException('Article not found');
    }

    candidates.sort((a, b) => {
      const aTime = a.createdAt ? a.createdAt.getTime() : 0;
      const bTime = b.createdAt ? b.createdAt.getTime() : 0;
      return aTime - bTime;
    });

    const latest = candidates[candidates.length - 1];

    const updatedAt =
      latest.createdAt ?? article.updatedAt ?? article.createdAt ?? new Date();

    return {
      id: article.id,
      slug: article.slug,
      language: latest.language,
      title: latest.title,
      content: latest.content,
      status: article.status,
      updatedAt: updatedAt.toISOString(),
    };
  }
}
