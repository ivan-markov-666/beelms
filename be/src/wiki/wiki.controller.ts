import { Controller, Get, Param, Query } from '@nestjs/common';
import { WikiService } from './wiki.service';
import { WikiListItemDto } from './dto/wiki-list-item.dto';
import { WikiArticleDetailDto } from './dto/wiki-article-detail.dto';

@Controller('wiki')
export class WikiController {
  constructor(private readonly wikiService: WikiService) {}

  @Get('articles')
  async findAll(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ): Promise<WikiListItemDto[]> {
    const pageNum = page ? Number(page) : undefined;
    const pageSizeNum = pageSize ? Number(pageSize) : undefined;
    return this.wikiService.getActiveArticlesList(pageNum, pageSizeNum);
  }

  @Get('articles/:slug')
  async findOne(
    @Param('slug') slug: string,
    @Query('lang') lang?: string,
  ): Promise<WikiArticleDetailDto> {
    return this.wikiService.getArticleBySlug(slug, lang);
  }
}
