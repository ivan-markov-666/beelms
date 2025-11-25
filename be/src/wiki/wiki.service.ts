import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WikiArticle } from './wiki-article.entity';
import { WikiArticleVersion } from './wiki-article-version.entity';
import { WikiListItemDto } from './dto/wiki-list-item.dto';

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

      published.sort((a, b) => {
        const aTime = a.createdAt ? a.createdAt.getTime() : 0;
        const bTime = b.createdAt ? b.createdAt.getTime() : 0;
        return aTime - bTime;
      });

      const latest = published[published.length - 1];
      const updatedAt =
        latest.createdAt ?? article.updatedAt ?? article.createdAt ?? new Date();

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
}
