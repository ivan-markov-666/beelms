import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SettingsService } from '../settings/settings.service';
import { CustomPage } from './custom-page.entity';
import { AdminCreateCustomPageDto } from './dto/admin-create-custom-page.dto';
import { AdminUpdateCustomPageDto } from './dto/admin-update-custom-page.dto';

export type CustomPageDto = {
  id: string;
  slug: string;
  title: string;
  contentMarkdown: string;
  isPublished: boolean;
  updatedAt: string;
  titleByLang?: Record<string, string> | null;
  contentMarkdownByLang?: Record<string, string> | null;
};

export type CustomPagePublicListItemDto = {
  slug: string;
  title: string;
  updatedAt: string;
};

const RESERVED_SLUGS = new Set([
  'about',
  'terms',
  'privacy',
  'cookie-policy',
  'imprint',
  'accessibility',
  'contact',
  'faq',
  'support',
]);

@Injectable()
export class CustomPagesService {
  constructor(
    @InjectRepository(CustomPage)
    private readonly customPagesRepo: Repository<CustomPage>,
    private readonly settingsService: SettingsService,
  ) {}

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

  private toAdminDto(page: CustomPage): CustomPageDto {
    return {
      id: page.id,
      slug: page.slug,
      title: page.title,
      contentMarkdown: page.contentMarkdown,
      titleByLang: page.titleByLang ?? null,
      contentMarkdownByLang: page.contentMarkdownByLang ?? null,
      isPublished: page.isPublished === true,
      updatedAt: page.updatedAt.toISOString(),
    };
  }

  private toPublicDto(
    page: CustomPage,
    lang: string,
  ): Omit<CustomPageDto, 'id' | 'titleByLang' | 'contentMarkdownByLang'> {
    const resolvedTitle = this.resolveByLang(
      page.titleByLang ?? null,
      page.title,
      lang,
    );
    const resolvedMarkdown = this.resolveByLang(
      page.contentMarkdownByLang ?? null,
      page.contentMarkdown,
      lang,
    );

    return {
      slug: page.slug,
      title: resolvedTitle,
      contentMarkdown: resolvedMarkdown,
      isPublished: page.isPublished === true,
      updatedAt: page.updatedAt.toISOString(),
    };
  }

  async adminList(): Promise<CustomPageDto[]> {
    const pages = await this.customPagesRepo.find({ order: { slug: 'ASC' } });
    return pages.map((p) => this.toAdminDto(p));
  }

  async adminCreate(dto: AdminCreateCustomPageDto): Promise<CustomPageDto> {
    const slug = dto.slug.trim().toLowerCase();
    const title = dto.title.trim();
    const contentMarkdown = dto.contentMarkdown ?? '';

    if (RESERVED_SLUGS.has(slug)) {
      throw new BadRequestException('Custom page slug is reserved');
    }

    const existing = await this.customPagesRepo.findOne({ where: { slug } });
    if (existing) {
      throw new BadRequestException('Custom page slug already exists');
    }

    const cfg = await this.settingsService.getOrCreateInstanceConfig();
    const supported = this.normalizeSupportedLangs(cfg.languages?.supported);

    const created = this.customPagesRepo.create({
      slug,
      title,
      contentMarkdown,
      titleByLang: this.normalizeLangStringMap(dto.titleByLang, supported),
      contentMarkdownByLang: this.normalizeLangStringMap(
        dto.contentMarkdownByLang,
        supported,
      ),
      isPublished:
        typeof dto.isPublished === 'boolean' ? dto.isPublished : true,
    });

    const saved = await this.customPagesRepo.save(created);
    return this.toAdminDto(saved);
  }

  async adminUpdate(
    id: string,
    dto: AdminUpdateCustomPageDto,
  ): Promise<CustomPageDto> {
    const page = await this.customPagesRepo.findOne({ where: { id } });
    if (!page) {
      throw new NotFoundException('Custom page not found');
    }

    const cfg = await this.settingsService.getOrCreateInstanceConfig();
    const supported = this.normalizeSupportedLangs(cfg.languages?.supported);

    if (typeof dto.slug === 'string') {
      const nextSlug = dto.slug.trim().toLowerCase();
      if (nextSlug && nextSlug !== page.slug) {
        if (RESERVED_SLUGS.has(nextSlug)) {
          throw new BadRequestException('Custom page slug is reserved');
        }
        const existing = await this.customPagesRepo.findOne({
          where: { slug: nextSlug },
        });
        if (existing && existing.id !== page.id) {
          throw new BadRequestException('Custom page slug already exists');
        }
        page.slug = nextSlug;
      }
    }

    if (typeof dto.title === 'string') {
      const nextTitle = dto.title.trim();
      if (nextTitle) {
        page.title = nextTitle;
      }
    }

    if (typeof dto.contentMarkdown === 'string') {
      page.contentMarkdown = dto.contentMarkdown;
    }

    if (typeof dto.isPublished === 'boolean') {
      page.isPublished = dto.isPublished;
    }

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

    const saved = await this.customPagesRepo.save(page);
    return this.toAdminDto(saved);
  }

  async adminDelete(id: string): Promise<void> {
    const existing = await this.customPagesRepo.findOne({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Custom page not found');
    }
    await this.customPagesRepo.delete({ id });
  }

  async publicGetBySlug(
    slug: string,
    lang?: string | null,
  ): Promise<
    Omit<CustomPageDto, 'id' | 'titleByLang' | 'contentMarkdownByLang'>
  > {
    const normalizedSlug = (slug ?? '').trim().toLowerCase();

    const urlEnabled =
      await this.settingsService.isBrandingPageUrlEnabled(normalizedSlug);
    if (!urlEnabled) {
      throw new NotFoundException('Page not found');
    }

    const page = await this.customPagesRepo.findOne({
      where: { slug: normalizedSlug },
    });

    if (!page || page.isPublished !== true) {
      throw new NotFoundException('Page not found');
    }

    const cfg = await this.settingsService.getOrCreateInstanceConfig();
    const supported = this.normalizeSupportedLangs(cfg.languages?.supported);
    const resolvedLang = this.resolveLang(
      lang,
      supported,
      cfg.languages?.default ?? 'bg',
    );

    return this.toPublicDto(page, resolvedLang);
  }

  async publicList(
    lang?: string | null,
  ): Promise<CustomPagePublicListItemDto[]> {
    const pages = await this.customPagesRepo.find({
      where: { isPublished: true },
      order: { slug: 'ASC' },
    });

    const cfg = await this.settingsService.getOrCreateInstanceConfig();
    const supported = this.normalizeSupportedLangs(cfg.languages?.supported);
    const resolvedLang = this.resolveLang(
      lang,
      supported,
      cfg.languages?.default ?? 'bg',
    );

    return pages.map((p) => ({
      slug: p.slug,
      title: this.resolveByLang(p.titleByLang ?? null, p.title, resolvedLang),
      updatedAt: p.updatedAt.toISOString(),
    }));
  }
}
