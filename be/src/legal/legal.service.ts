import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LegalPage } from './legal-page.entity';
import { AdminUpdateLegalPageDto } from './dto/admin-update-legal-page.dto';
import { SettingsService } from '../settings/settings.service';

export type LegalPageDto = {
  slug: string;
  title: string;
  contentMarkdown: string;
  updatedAt: string;
  titleByLang?: Record<string, string> | null;
  contentMarkdownByLang?: Record<string, string> | null;
};

@Injectable()
export class LegalService {
  constructor(
    @InjectRepository(LegalPage)
    private readonly legalPagesRepo: Repository<LegalPage>,
    private readonly settingsService: SettingsService,
  ) {}

  private async ensureDefaultPagesExist(): Promise<void> {
    const defaults: Array<{
      slug: string;
      title: string;
      contentMarkdown: string;
    }> = [
      {
        slug: 'about',
        title: 'About',
        contentMarkdown: '# About\n\nPlaceholder about content.',
      },
      {
        slug: 'terms',
        title: 'Terms and Conditions',
        contentMarkdown: '# Terms\n\nPlaceholder terms content.',
      },
      {
        slug: 'privacy',
        title: 'Privacy Policy',
        contentMarkdown: '# Privacy\n\nPlaceholder privacy content.',
      },
      {
        slug: 'cookie-policy',
        title: 'Cookie Policy',
        contentMarkdown:
          '# Cookie Policy\n\nPlaceholder cookie policy content.',
      },
      {
        slug: 'imprint',
        title: 'Imprint',
        contentMarkdown: '# Imprint\n\nPlaceholder imprint content.',
      },
      {
        slug: 'accessibility',
        title: 'Accessibility Statement',
        contentMarkdown:
          '# Accessibility\n\nPlaceholder accessibility statement.',
      },
      {
        slug: 'contact',
        title: 'Contact',
        contentMarkdown: '# Contact\n\nPlaceholder contact content.',
      },
      {
        slug: 'faq',
        title: 'FAQ',
        contentMarkdown: '# FAQ\n\nPlaceholder FAQ content.',
      },
      {
        slug: 'support',
        title: 'Support',
        contentMarkdown: '# Support\n\nPlaceholder support content.',
      },
    ];

    await this.legalPagesRepo
      .createQueryBuilder()
      .insert()
      .into(LegalPage)
      .values(defaults)
      .orIgnore()
      .execute();
  }

  private normalizeSupportedLangs(raw: unknown): string[] {
    return Array.isArray(raw)
      ? raw
          .map((v) => (typeof v === 'string' ? v.trim().toLowerCase() : ''))
          .filter(Boolean)
      : [];
  }

  private resolveLang(
    raw: string | null | undefined,
    supported: string[],
    fallbackDefault: string,
  ): string {
    const normalized = (raw ?? '').trim().toLowerCase();
    if (normalized && supported.includes(normalized)) {
      return normalized;
    }
    const d = (fallbackDefault ?? '').trim().toLowerCase();
    if (d && supported.includes(d)) {
      return d;
    }
    return supported[0] ?? 'bg';
  }

  private normalizeLangStringMap(
    incoming: Record<string, string | null> | null | undefined,
    supported: string[],
  ): Record<string, string> | null {
    if (typeof incoming === 'undefined') {
      return null;
    }
    if (incoming === null) {
      return null;
    }
    const supportedSet = new Set(supported);
    const out: Record<string, string> = {};
    for (const [rawKey, rawValue] of Object.entries(incoming)) {
      const key = (rawKey ?? '').trim().toLowerCase();
      if (!key) continue;
      if (!supportedSet.has(key)) continue;
      const v = typeof rawValue === 'string' ? rawValue.trim() : '';
      if (v) {
        out[key] = v;
      }
    }
    return Object.keys(out).length > 0 ? out : null;
  }

  private resolveByLang(
    byLang: Record<string, string> | null | undefined,
    globalValue: string,
    lang: string,
  ): string {
    const candidate = (byLang?.[lang] ?? '').trim();
    if (candidate) return candidate;
    return globalValue;
  }

  async getBySlug(slug: string, lang?: string | null): Promise<LegalPageDto> {
    const page = await this.legalPagesRepo.findOne({ where: { slug } });
    if (!page) {
      throw new NotFoundException('Legal page not found');
    }

    const cfg = await this.settingsService.getOrCreateInstanceConfig();
    const supported = this.normalizeSupportedLangs(cfg.languages?.supported);
    const resolvedLang = this.resolveLang(
      lang,
      supported,
      cfg.languages?.default ?? 'bg',
    );

    const resolvedTitle = this.resolveByLang(
      page.titleByLang ?? null,
      page.title,
      resolvedLang,
    );
    const resolvedMarkdown = this.resolveByLang(
      page.contentMarkdownByLang ?? null,
      page.contentMarkdown,
      resolvedLang,
    );

    return {
      slug: page.slug,
      title: resolvedTitle,
      contentMarkdown: resolvedMarkdown,
      updatedAt: page.updatedAt.toISOString(),
    };
  }

  async listAdminPages(): Promise<LegalPageDto[]> {
    await this.ensureDefaultPagesExist();
    const pages = await this.legalPagesRepo.find({ order: { slug: 'ASC' } });
    return pages.map((page) => ({
      slug: page.slug,
      title: page.title,
      contentMarkdown: page.contentMarkdown,
      titleByLang: page.titleByLang ?? null,
      contentMarkdownByLang: page.contentMarkdownByLang ?? null,
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

    const cfg = await this.settingsService.getOrCreateInstanceConfig();
    const supported = this.normalizeSupportedLangs(cfg.languages?.supported);

    if (dto.title !== undefined) {
      page.title = dto.title;
    }
    page.contentMarkdown = dto.contentMarkdown;

    if (typeof dto.titleByLang !== 'undefined') {
      page.titleByLang = this.normalizeLangStringMap(
        dto.titleByLang,
        supported,
      );
    }

    if (typeof dto.contentMarkdownByLang !== 'undefined') {
      page.contentMarkdownByLang = this.normalizeLangStringMap(
        dto.contentMarkdownByLang,
        supported,
      );
    }

    const saved = await this.legalPagesRepo.save(page);

    return {
      slug: saved.slug,
      title: saved.title,
      contentMarkdown: saved.contentMarkdown,
      titleByLang: saved.titleByLang ?? null,
      contentMarkdownByLang: saved.contentMarkdownByLang ?? null,
      updatedAt: saved.updatedAt.toISOString(),
    };
  }
}
