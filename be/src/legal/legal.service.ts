import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LegalPage } from './legal-page.entity';
import { AdminUpdateLegalPageDto } from './dto/admin-update-legal-page.dto';

export type LegalPageDto = {
  slug: string;
  title: string;
  contentMarkdown: string;
  updatedAt: string;
};

@Injectable()
export class LegalService {
  constructor(
    @InjectRepository(LegalPage)
    private readonly legalPagesRepo: Repository<LegalPage>,
  ) {}

  async getBySlug(slug: string): Promise<LegalPageDto> {
    const page = await this.legalPagesRepo.findOne({ where: { slug } });
    if (!page) {
      throw new NotFoundException('Legal page not found');
    }

    return {
      slug: page.slug,
      title: page.title,
      contentMarkdown: page.contentMarkdown,
      updatedAt: page.updatedAt.toISOString(),
    };
  }

  async listAdminPages(): Promise<LegalPageDto[]> {
    const pages = await this.legalPagesRepo.find({ order: { slug: 'ASC' } });
    return pages.map((page) => ({
      slug: page.slug,
      title: page.title,
      contentMarkdown: page.contentMarkdown,
      updatedAt: page.updatedAt.toISOString(),
    }));
  }

  async updateBySlug(
    slug: string,
    dto: AdminUpdateLegalPageDto,
  ): Promise<LegalPageDto> {
    const page = await this.legalPagesRepo.findOne({ where: { slug } });
    if (!page) {
      throw new NotFoundException('Legal page not found');
    }

    if (dto.title !== undefined) {
      page.title = dto.title;
    }
    page.contentMarkdown = dto.contentMarkdown;

    const saved = await this.legalPagesRepo.save(page);

    return {
      slug: saved.slug,
      title: saved.title,
      contentMarkdown: saved.contentMarkdown,
      updatedAt: saved.updatedAt.toISOString(),
    };
  }
}
