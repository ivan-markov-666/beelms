import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import AdmZip from 'adm-zip';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { In, LessThan, Repository } from 'typeorm';
import { WikiArticle } from './wiki-article.entity';
import { WikiArticleVersion } from './wiki-article-version.entity';
import { WikiArticleFeedback } from './wiki-article-feedback.entity';
import { WikiArticleView } from './wiki-article-view.entity';
import { WikiArticleIpViewDaily } from './wiki-article-ip-view-daily.entity';
import { User } from '../auth/user.entity';
import type { UserRole } from '../auth/user-role';
import { SettingsService } from '../settings/settings.service';
import { WikiListItemDto } from './dto/wiki-list-item.dto';
import { AdminWikiListItemDto } from './dto/admin-wiki-list-item.dto';
import { WikiArticleDetailDto } from './dto/wiki-article-detail.dto';
import { WikiRelatedArticleDto } from './dto/wiki-related-article.dto';
import { AdminUpdateWikiArticleDto } from './dto/admin-update-wiki-article.dto';
import { AdminCreateWikiArticleDto } from './dto/admin-create-wiki-article.dto';
import { AdminWikiArticleVersionDto } from './dto/admin-wiki-article-version.dto';
import { AdminAutosaveWikiDraftDto } from './dto/admin-autosave-wiki-draft.dto';
import { WikiMediaItemDto } from './dto/wiki-media-item.dto';
import { CreateWikiArticleFeedbackDto } from './dto/create-wiki-article-feedback.dto';

const DEFAULT_MEDIA_ROOT = path.join(process.cwd(), 'media');
const WIKI_MEDIA_SUBDIR = 'wiki';
const MAX_WIKI_MEDIA_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const MAX_WIKI_PACKAGE_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25MB
const WIKI_IP_VIEW_SESSION_WINDOW_MINUTES = 15;

export interface WikiUploadedFile {
  mimetype?: string;
  size?: number;
  buffer?: Buffer;
  originalname?: string;
}

function getMediaRoot(): string {
  const fromEnv = process.env.MEDIA_ROOT;
  if (fromEnv && fromEnv.trim().length > 0) {
    return fromEnv;
  }

  return DEFAULT_MEDIA_ROOT;
}

function buildWikiArticleMediaDir(slug: string): string {
  return path.join(getMediaRoot(), WIKI_MEDIA_SUBDIR, slug);
}

function sanitizeFilename(originalName: string): string {
  const ext = path.extname(originalName);
  const base = path.basename(originalName, ext);
  const safeBase = base
    .toLowerCase()
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '');

  const finalBase = safeBase || 'file';
  const timestamp = Date.now();

  return `${finalBase}-${timestamp}${ext.toLowerCase()}`;
}

function sanitizeBasename(originalName: string): string {
  const ext = path.extname(originalName);
  const base = path.basename(originalName, ext);
  const safeBase = (base ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '');
  return safeBase || 'file';
}

function normalizeLanguageCode(raw: string): string {
  const normalized = (raw ?? '').trim().toLowerCase();
  if (!normalized) return '';
  return normalized === 'uk' ? 'ua' : normalized;
}

function extractLanguageFromMarkdownFilename(filename: string): string {
  const trimmed = (filename ?? '').trim();
  if (!trimmed) return '';

  const match = trimmed.match(/-([a-zA-Z0-9-]{2,15})\.md$/);
  if (!match) return '';

  return normalizeLanguageCode(match[1] ?? '');
}

function extractTitleAndSubtitleFromMarkdownFilename(
  filename: string,
  language: string,
): { title: string | null; subtitle: string | null } {
  const baseName = path.basename((filename ?? '').trim(), '.md');
  if (!baseName) {
    return { title: null, subtitle: null };
  }

  const withoutLang = baseName.replace(new RegExp(`-${language}$`, 'i'), '');
  const trimmed = (withoutLang ?? '').trim();
  if (!trimmed) {
    return { title: null, subtitle: null };
  }

  const separator = '__';
  const separatorIndex = trimmed.indexOf(separator);
  if (separatorIndex === -1) {
    return { title: trimmed, subtitle: null };
  }

  const titlePart = trimmed.slice(0, separatorIndex).trim();
  const subtitlePart = trimmed.slice(separatorIndex + separator.length).trim();

  return {
    title: titlePart.length > 0 ? titlePart : null,
    subtitle: subtitlePart.length > 0 ? subtitlePart : null,
  };
}

type ImageVariantIndex = {
  shared?: { filename: string; buffer: Buffer };
  byLang: Map<string, { filename: string; buffer: Buffer }>;
};

function parseImageVariantFromFilename(filename: string): {
  baseKey: string;
  variant: 'shared' | { lang: string };
} | null {
  const rawBase = path.basename(filename, path.extname(filename));
  const trimmed = (rawBase ?? '').trim();
  if (!trimmed) return null;

  const separator = '__';
  const idx = trimmed.lastIndexOf(separator);
  if (idx === -1) {
    return { baseKey: trimmed, variant: 'shared' };
  }

  const baseKey = trimmed.slice(0, idx).trim();
  const suffix = trimmed.slice(idx + separator.length).trim();
  if (!baseKey) return null;

  const normalizedSuffix = normalizeLanguageCode(suffix);
  if (!normalizedSuffix || normalizedSuffix.toLowerCase() === 'shared') {
    return { baseKey, variant: 'shared' };
  }

  return { baseKey, variant: { lang: normalizedSuffix } };
}

function isAbsoluteOrExternalUrl(url: string): boolean {
  const trimmed = (url ?? '').trim();
  if (!trimmed) return true;
  if (trimmed.startsWith('data:')) return true;
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return true;
  }
  if (trimmed.startsWith('/')) return true;
  return false;
}

function parseMarkdownInlineLinkTarget(rawTarget: string): {
  url: string;
  suffix: string;
} {
  const trimmed = (rawTarget ?? '').trim();
  if (!trimmed) return { url: '', suffix: '' };

  const unwrapped =
    trimmed.startsWith('<') && trimmed.endsWith('>')
      ? trimmed.slice(1, -1)
      : trimmed;

  const firstSpace = unwrapped.search(/\s/);
  if (firstSpace === -1) {
    return { url: unwrapped, suffix: '' };
  }

  return {
    url: unwrapped.slice(0, firstSpace),
    suffix: unwrapped.slice(firstSpace).trimStart(),
  };
}

function normalizeReferencedAssetKey(rawUrl: string): string {
  const cleaned = (rawUrl ?? '').split('#')[0]?.split('?')[0] ?? '';
  const basename = path.basename(cleaned);
  const withoutExt = path.basename(basename, path.extname(basename));
  return (withoutExt ?? '').trim();
}

function resolveImageBucket(
  imageIndex: Map<string, ImageVariantIndex>,
  rawKey: string,
): ImageVariantIndex | undefined {
  const trimmed = (rawKey ?? '').trim();
  if (!trimmed) return undefined;

  const direct = imageIndex.get(trimmed);
  if (direct) return direct;

  const separator = '__';
  const idx = trimmed.lastIndexOf(separator);
  if (idx === -1) return undefined;

  const baseKey = trimmed.slice(0, idx).trim();
  if (!baseKey) return undefined;
  return imageIndex.get(baseKey);
}

function extractFirstMarkdownHeading(
  content: string,
  level: 1 | 2,
): string | null {
  const lines = (content ?? '').split(/\r?\n/);

  let inFence = false;
  let fenceMarker: string | null = null;
  const prefix = level === 1 ? '#' : '##';

  for (const rawLine of lines) {
    const line = rawLine ?? '';
    const fenceMatch = /^\s*(```+|~~~+)\s*/.exec(line);
    if (fenceMatch) {
      const marker = fenceMatch[1];
      if (!inFence) {
        inFence = true;
        fenceMarker = marker;
      } else if (fenceMarker && marker.startsWith(fenceMarker[0])) {
        inFence = false;
        fenceMarker = null;
      }
      continue;
    }

    if (inFence) {
      continue;
    }

    const headingMatch = new RegExp(`^\\s*${prefix}\\s+(.+)$`).exec(line);
    if (!headingMatch) {
      continue;
    }

    const title = (headingMatch[1] ?? '').trim();
    return title.length > 0 ? title : null;
  }

  return null;
}

@Injectable()
export class WikiService {
  constructor(
    @InjectRepository(WikiArticle)
    private readonly articleRepo: Repository<WikiArticle>,
    @InjectRepository(WikiArticleVersion)
    private readonly versionRepo: Repository<WikiArticleVersion>,
    @InjectRepository(WikiArticleFeedback)
    private readonly feedbackRepo: Repository<WikiArticleFeedback>,
    @InjectRepository(WikiArticleView)
    private readonly viewRepo: Repository<WikiArticleView>,
    @InjectRepository(WikiArticleIpViewDaily)
    private readonly ipViewDailyRepo: Repository<WikiArticleIpViewDaily>,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    private readonly settingsService: SettingsService,
  ) {}

  async adminImportArticleTranslationsFromMarkdownFiles(
    actorUserId: string,
    articleId: string,
    files: WikiUploadedFile[] | undefined,
  ): Promise<{
    results: Array<{
      filename: string;
      language: string | null;
      status: 'created' | 'skipped' | 'error';
      versionNumber?: number;
      error?: string;
    }>;
  }> {
    if (!files || files.length === 0) {
      throw new BadRequestException('Files are required');
    }

    const article = await this.articleRepo.findOne({
      where: { id: articleId },
    });
    await this.requireArticleOwnershipForAuthor(actorUserId, article);

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    const cfg = await this.settingsService.getOrCreateInstanceConfig();
    const supportedLangs = Array.isArray(cfg.languages?.supported)
      ? cfg.languages.supported.map((c) => normalizeLanguageCode(c))
      : [];
    const supportedLangSet = new Set(supportedLangs.filter(Boolean));

    const results: Array<{
      filename: string;
      language: string | null;
      status: 'created' | 'skipped' | 'error';
      versionNumber?: number;
      error?: string;
    }> = [];

    for (const file of files) {
      const filename = (file.originalname ?? 'file.md').trim() || 'file.md';
      const language = extractLanguageFromMarkdownFilename(filename);

      if (!language) {
        results.push({
          filename,
          language: null,
          status: 'error',
          error: 'Cannot detect language from filename',
        });
        continue;
      }

      if (supportedLangSet.size > 0 && !supportedLangSet.has(language)) {
        results.push({
          filename,
          language,
          status: 'error',
          error: 'Language is not supported',
        });
        continue;
      }

      if (!file.buffer) {
        results.push({
          filename,
          language,
          status: 'error',
          error: 'File buffer is missing',
        });
        continue;
      }

      const content = file.buffer
        .toString('utf-8')
        .replace(/^\uFEFF/, '')
        .trimEnd();

      if (!content.trim()) {
        results.push({
          filename,
          language,
          status: 'error',
          error: 'File is empty',
        });
        continue;
      }

      const { title: titleFromFilename, subtitle: subtitleFromFilename } =
        extractTitleAndSubtitleFromMarkdownFilename(filename, language);

      const titleFromMd = extractFirstMarkdownHeading(content, 1);
      const baseName = path.basename(filename, '.md');
      const derivedTitle = baseName.replace(
        new RegExp(`-${language}$`, 'i'),
        '',
      );
      const title =
        (titleFromFilename ?? titleFromMd ?? derivedTitle ?? '').trim() ||
        article.slug;

      const subtitleFromMd = extractFirstMarkdownHeading(content, 2);
      const subtitleCandidate = (
        subtitleFromFilename ??
        subtitleFromMd ??
        ''
      ).trim();
      const subtitle = subtitleCandidate.length > 0 ? subtitleCandidate : null;

      const latest = await this.versionRepo.find({
        where: { article: { id: article.id }, language },
        order: { versionNumber: 'DESC', createdAt: 'DESC' },
        take: 1,
        relations: ['article'],
      });

      const latestVersion = latest[0] ?? null;
      const currentTitle = (latestVersion?.title ?? '').trim();
      const currentSubtitle = (latestVersion?.subtitle ?? '').trim();
      const currentContent = latestVersion?.content ?? '';
      const incomingSubtitle = (subtitle ?? '').trim();

      const changed =
        currentTitle !== title ||
        currentSubtitle !== incomingSubtitle ||
        currentContent !== content;

      if (!changed && latestVersion) {
        results.push({
          filename,
          language,
          status: 'skipped',
          versionNumber: latestVersion.versionNumber,
        });
        continue;
      }

      const nextVersionNumber = latestVersion
        ? (latestVersion.versionNumber ?? 0) + 1
        : 1;

      const entity = this.versionRepo.create({
        article,
        language,
        title,
        subtitle,
        content,
        versionNumber: nextVersionNumber,
        createdByUserId: actorUserId,
        changeSummary: `Imported from ${filename}`,
        isPublished: article.status === 'active',
      });

      const saved = await this.versionRepo.save(entity);
      results.push({
        filename,
        language,
        status: 'created',
        versionNumber: saved.versionNumber,
      });
    }

    return { results };
  }

  private async upsertArticleMediaFromBuffer(
    articleSlug: string,
    originalName: string,
    buffer: Buffer,
  ): Promise<WikiMediaItemDto> {
    const mediaDir = buildWikiArticleMediaDir(articleSlug);
    await fs.promises.mkdir(mediaDir, { recursive: true });

    const ext = path.extname(originalName).toLowerCase() || '.bin';
    const safeBase = sanitizeBasename(originalName);
    const hash = crypto
      .createHash('sha256')
      .update(buffer)
      .digest('hex')
      .slice(0, 12);
    const filename = `${safeBase}-${hash}${ext}`;
    const filePath = path.join(mediaDir, filename);

    try {
      await fs.promises.access(filePath, fs.constants.F_OK);
    } catch {
      await fs.promises.writeFile(filePath, buffer);
    }

    return {
      filename,
      url: `/wiki/media/${articleSlug}/${filename}`,
    };
  }

  async adminImportArticleTranslationsFromPackage(
    actorUserId: string,
    articleId: string,
    file: WikiUploadedFile | undefined,
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
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const originalName = (file.originalname ?? '').toLowerCase();
    if (originalName && !originalName.endsWith('.zip')) {
      throw new BadRequestException('Only .zip packages are allowed');
    }

    if (
      typeof file.size === 'number' &&
      file.size > MAX_WIKI_PACKAGE_FILE_SIZE_BYTES
    ) {
      throw new BadRequestException('File is too large');
    }

    if (!file.buffer) {
      throw new BadRequestException('File buffer is missing');
    }

    const article = await this.articleRepo.findOne({
      where: { id: articleId },
    });
    await this.requireArticleOwnershipForAuthor(actorUserId, article);
    if (!article) {
      throw new NotFoundException('Article not found');
    }

    const cfg = await this.settingsService.getOrCreateInstanceConfig();
    const supportedLangs = Array.isArray(cfg.languages?.supported)
      ? cfg.languages.supported.map((c) => normalizeLanguageCode(c))
      : [];
    const supportedLangSet = new Set(supportedLangs.filter(Boolean));

    const results: Array<{
      filename: string;
      language: string | null;
      status: 'created' | 'skipped' | 'error';
      versionNumber?: number;
      warnings?: string[];
      error?: string;
    }> = [];

    let zip: AdmZip;
    try {
      zip = new AdmZip(file.buffer);
    } catch {
      throw new BadRequestException('Invalid ZIP package');
    }

    const mdEntries: Array<{ filename: string; buffer: Buffer }> = [];
    const imageIndex = new Map<string, ImageVariantIndex>();

    const allowedImageExts = new Set([
      '.png',
      '.jpg',
      '.jpeg',
      '.gif',
      '.webp',
      '.svg',
    ]);

    for (const entry of zip.getEntries()) {
      if (entry.isDirectory) continue;
      const entryName = entry.entryName || '';
      if (entryName.startsWith('__MACOSX/')) continue;
      const baseName = path.basename(entryName);
      if (!baseName) continue;

      const ext = path.extname(baseName).toLowerCase();
      const entryBuffer = entry.getData();

      if (ext === '.md') {
        mdEntries.push({ filename: baseName, buffer: entryBuffer });
        continue;
      }

      if (!allowedImageExts.has(ext)) {
        continue;
      }

      if (entryBuffer.length > MAX_WIKI_MEDIA_FILE_SIZE_BYTES) {
        continue;
      }

      const parsed = parseImageVariantFromFilename(baseName);
      if (!parsed) continue;

      const bucket = imageIndex.get(parsed.baseKey) ?? {
        byLang: new Map<string, { filename: string; buffer: Buffer }>(),
      };

      if (parsed.variant === 'shared') {
        bucket.shared = { filename: baseName, buffer: entryBuffer };
      } else {
        bucket.byLang.set(parsed.variant.lang, {
          filename: baseName,
          buffer: entryBuffer,
        });
      }

      imageIndex.set(parsed.baseKey, bucket);
    }

    const uploadedImageUrlByVariant = new Map<string, string>();
    const ensureImageUploaded = async (
      variantFilename: string,
      buffer: Buffer,
    ): Promise<string> => {
      const key = `${variantFilename}:${crypto
        .createHash('sha256')
        .update(buffer)
        .digest('hex')
        .slice(0, 12)}`;
      const existing = uploadedImageUrlByVariant.get(key);
      if (existing) return existing;

      const uploaded = await this.upsertArticleMediaFromBuffer(
        article.slug,
        variantFilename,
        buffer,
      );
      uploadedImageUrlByVariant.set(key, uploaded.url);
      return uploaded.url;
    };

    for (const md of mdEntries) {
      const filename = (md.filename ?? 'file.md').trim() || 'file.md';
      const language = extractLanguageFromMarkdownFilename(filename);

      if (!language) {
        results.push({
          filename,
          language: null,
          status: 'error',
          error: 'Cannot detect language from filename',
        });
        continue;
      }

      if (supportedLangSet.size > 0 && !supportedLangSet.has(language)) {
        results.push({
          filename,
          language,
          status: 'error',
          error: 'Language is not supported',
        });
        continue;
      }

      const rawContent = md.buffer
        .toString('utf-8')
        .replace(/^\uFEFF/, '')
        .trimEnd();

      if (!rawContent.trim()) {
        results.push({
          filename,
          language,
          status: 'error',
          error: 'File is empty',
        });
        continue;
      }

      const warnings: string[] = [];

      const rewrittenContent = await (async () => {
        const imgRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
        const parts: Array<{
          start: number;
          end: number;
          replacement: string;
        }> = [];

        let match: RegExpExecArray | null;
        while ((match = imgRegex.exec(rawContent)) !== null) {
          const alt = match[1] ?? '';
          const target = match[2] ?? '';
          const { url, suffix } = parseMarkdownInlineLinkTarget(target);
          if (!url || isAbsoluteOrExternalUrl(url)) {
            continue;
          }

          const assetKey = normalizeReferencedAssetKey(url);
          if (!assetKey) {
            continue;
          }

          const bucket = resolveImageBucket(imageIndex, assetKey);
          if (!bucket) {
            warnings.push(`Missing image: ${url}`);
            continue;
          }

          const langVariant = bucket.byLang.get(language);
          const selected = langVariant ?? bucket.shared;
          if (!selected) {
            warnings.push(`Missing image variant: ${url}`);
            continue;
          }

          const newUrl = await ensureImageUploaded(
            selected.filename,
            selected.buffer,
          );
          const replacement = `![${alt}](${newUrl}${suffix ? ` ${suffix}` : ''})`;
          parts.push({
            start: match.index,
            end: match.index + match[0].length,
            replacement,
          });
        }

        if (parts.length === 0) {
          return rawContent;
        }

        let out = '';
        let cursor = 0;
        for (const p of parts) {
          out += rawContent.slice(cursor, p.start);
          out += p.replacement;
          cursor = p.end;
        }
        out += rawContent.slice(cursor);
        return out;
      })();

      const { title: titleFromFilename, subtitle: subtitleFromFilename } =
        extractTitleAndSubtitleFromMarkdownFilename(filename, language);

      const titleFromMd = extractFirstMarkdownHeading(rewrittenContent, 1);
      const baseName = path.basename(filename, '.md');
      const derivedTitle = baseName.replace(
        new RegExp(`-${language}$`, 'i'),
        '',
      );
      const title =
        (titleFromFilename ?? titleFromMd ?? derivedTitle ?? '').trim() ||
        article.slug;

      const subtitleFromMd = extractFirstMarkdownHeading(rewrittenContent, 2);
      const subtitleCandidate = (
        subtitleFromFilename ??
        subtitleFromMd ??
        ''
      ).trim();
      const subtitle = subtitleCandidate.length > 0 ? subtitleCandidate : null;

      const latest = await this.versionRepo.find({
        where: { article: { id: article.id }, language },
        order: { versionNumber: 'DESC', createdAt: 'DESC' },
        take: 1,
        relations: ['article'],
      });

      const latestVersion = latest[0] ?? null;
      const currentTitle = (latestVersion?.title ?? '').trim();
      const currentSubtitle = (latestVersion?.subtitle ?? '').trim();
      const currentContent = latestVersion?.content ?? '';
      const incomingSubtitle = (subtitle ?? '').trim();

      const changed =
        currentTitle !== title ||
        currentSubtitle !== incomingSubtitle ||
        currentContent !== rewrittenContent;

      if (!changed && latestVersion) {
        results.push({
          filename,
          language,
          status: 'skipped',
          versionNumber: latestVersion.versionNumber,
          warnings: warnings.length > 0 ? warnings : undefined,
        });
        continue;
      }

      const nextVersionNumber = latestVersion
        ? (latestVersion.versionNumber ?? 0) + 1
        : 1;

      const entity = this.versionRepo.create({
        article,
        language,
        title,
        subtitle,
        content: rewrittenContent,
        versionNumber: nextVersionNumber,
        createdByUserId: actorUserId,
        changeSummary: `Imported from package ${file.originalname ?? 'package.zip'} (${filename})`,
        isPublished: article.status === 'active',
      });

      const saved = await this.versionRepo.save(entity);
      results.push({
        filename,
        language,
        status: 'created',
        versionNumber: saved.versionNumber,
        warnings: warnings.length > 0 ? warnings : undefined,
      });
    }

    return { results };
  }

  async getAdminArticlesCount(actorUserId: string): Promise<number> {
    const role = await this.getActiveUserRole(actorUserId);
    if (role === 'author') {
      return this.articleRepo.count({
        where: { createdByUserId: actorUserId },
      });
    }
    return this.articleRepo.count();
  }

  async adminBulkUpdateArticleStatus(
    actorUserId: string,
    ids: string[],
    status: string,
  ): Promise<number> {
    const uniqueIds = Array.from(new Set(ids.map((id) => id.trim()))).filter(
      (id) => id.length > 0,
    );
    if (uniqueIds.length === 0) {
      return 0;
    }

    const role = await this.getActiveUserRole(actorUserId);

    if (role === 'author') {
      const allowed = await this.articleRepo.find({
        where: { id: In(uniqueIds), createdByUserId: actorUserId },
        select: { id: true },
      });
      const allowedIds = allowed.map((a) => a.id);
      if (allowedIds.length !== uniqueIds.length) {
        throw new NotFoundException('Article not found');
      }

      const result = await this.articleRepo.update(
        { id: In(allowedIds), createdByUserId: actorUserId },
        { status },
      );
      return result.affected ?? 0;
    }

    const result = await this.articleRepo.update(
      { id: In(uniqueIds) },
      { status },
    );
    return result.affected ?? 0;
  }

  async adminBulkDeleteArticles(
    actorUserId: string,
    ids: string[],
  ): Promise<number> {
    const uniqueIds = Array.from(new Set(ids.map((id) => id.trim()))).filter(
      (id) => id.length > 0,
    );
    if (uniqueIds.length === 0) {
      return 0;
    }

    const role = await this.getActiveUserRole(actorUserId);

    if (role === 'author') {
      const allowed = await this.articleRepo.find({
        where: { id: In(uniqueIds), createdByUserId: actorUserId },
        select: { id: true },
      });
      const allowedIds = allowed.map((a) => a.id);
      if (allowedIds.length !== uniqueIds.length) {
        throw new NotFoundException('Article not found');
      }

      const result = await this.articleRepo.delete({
        id: In(allowedIds),
        createdByUserId: actorUserId,
      });
      return result.affected ?? 0;
    }

    const result = await this.articleRepo.delete({ id: In(uniqueIds) });
    return result.affected ?? 0;
  }

  async adminPurgeAllArticles(actorUserId: string): Promise<number> {
    const role = await this.getActiveUserRole(actorUserId);
    if (role !== 'admin') {
      throw new ForbiddenException('Admin access required');
    }

    const result = await this.articleRepo
      .createQueryBuilder()
      .delete()
      .from(WikiArticle)
      .execute();
    return result.affected ?? 0;
  }

  private lastViewsRetentionRunDate: string | null = null;
  private lastIpViewsRetentionRunDate: string | null = null;

  private async getActiveUserRole(userId: string): Promise<UserRole> {
    const user = await this.usersRepo.findOne({
      where: { id: userId, active: true },
    });

    if (!user) {
      throw new ForbiddenException('Access denied');
    }

    return user.role;
  }

  private async requireArticleOwnershipForAuthor(
    actorUserId: string,
    article: WikiArticle | null,
  ): Promise<void> {
    const role = await this.getActiveUserRole(actorUserId);

    if (role !== 'author') {
      return;
    }

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    if (article.createdByUserId !== actorUserId) {
      throw new NotFoundException('Article not found');
    }
  }

  private formatUtcDate(date: Date): string {
    return date.toISOString().slice(0, 10);
  }

  private async cleanupOldViewsIfNeeded(todayIso: string): Promise<void> {
    if (this.lastViewsRetentionRunDate === todayIso) {
      return;
    }

    this.lastViewsRetentionRunDate = todayIso;

    const cutoff = new Date();
    cutoff.setUTCDate(cutoff.getUTCDate() - 180);
    const cutoffIso = this.formatUtcDate(cutoff);

    await this.viewRepo.delete({
      viewDate: LessThan(cutoffIso),
    });
  }

  private async cleanupOldIpViewsIfNeeded(todayIso: string): Promise<void> {
    if (this.lastIpViewsRetentionRunDate === todayIso) {
      return;
    }

    this.lastIpViewsRetentionRunDate = todayIso;

    const cutoff = new Date();
    cutoff.setUTCDate(cutoff.getUTCDate() - 180);
    const cutoffIso = this.formatUtcDate(cutoff);

    await this.ipViewDailyRepo.delete({
      viewDate: LessThan(cutoffIso),
    });
  }

  private hashIp(ip: string): string {
    const salt =
      process.env.WIKI_IP_HASH_SALT ?? 'dev_wiki_ip_salt_change_me_please';
    return crypto.createHash('sha256').update(`${salt}|${ip}`).digest('hex');
  }

  private async recordArticleView(
    articleId: string,
    language: string,
  ): Promise<void> {
    const todayIso = this.formatUtcDate(new Date());

    try {
      await this.cleanupOldViewsIfNeeded(todayIso);

      const existing = await this.viewRepo.findOne({
        where: {
          articleId,
          language,
          viewDate: todayIso,
        },
      });

      if (existing) {
        existing.viewCount = (existing.viewCount ?? 0) + 1;
        await this.viewRepo.save(existing);
        return;
      }

      await this.viewRepo.save(
        this.viewRepo.create({
          articleId,
          language,
          viewDate: todayIso,
          viewCount: 1,
        }),
      );
    } catch {
      // best-effort tracking; do not break page rendering
      return;
    }
  }

  private async recordArticleIpView(
    articleId: string,
    language: string,
    clientIp: string,
  ): Promise<void> {
    const todayIso = this.formatUtcDate(new Date());
    const now = new Date();
    const ipHash = this.hashIp(clientIp);

    try {
      await this.cleanupOldIpViewsIfNeeded(todayIso);

      await this.ipViewDailyRepo.query(
        `
          INSERT INTO wiki_article_ip_views_daily
            (article_id, language, view_date, ip_hash, session_count, last_seen_at)
          VALUES
            ($1, $2, $3, $4, 1, $5)
          ON CONFLICT (article_id, language, view_date, ip_hash)
          DO UPDATE SET
            session_count = CASE
              WHEN wiki_article_ip_views_daily.last_seen_at < ($5::timestamptz - interval '${WIKI_IP_VIEW_SESSION_WINDOW_MINUTES} minutes')
                THEN wiki_article_ip_views_daily.session_count + 1
              ELSE wiki_article_ip_views_daily.session_count
            END,
            last_seen_at = GREATEST(wiki_article_ip_views_daily.last_seen_at, $5::timestamptz),
            updated_at = now()
        `,
        [articleId, language, todayIso, ipHash, now.toISOString()],
      );
    } catch {
      return;
    }
  }

  async submitArticleFeedback(
    slug: string,
    userId: string | null,
    dto: CreateWikiArticleFeedbackDto,
  ): Promise<void> {
    const article = await this.articleRepo.findOne({
      where: { slug, status: 'active', visibility: 'public' },
    });

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    if (userId) {
      const existing = await this.feedbackRepo.findOne({
        where: { articleId: article.id, userId },
      });

      if (existing) {
        existing.helpful = dto.helpful;
        await this.feedbackRepo.save(existing);
        return;
      }

      await this.feedbackRepo.save(
        this.feedbackRepo.create({
          articleId: article.id,
          userId,
          helpful: dto.helpful,
        }),
      );
      return;
    }

    await this.feedbackRepo.save(
      this.feedbackRepo.create({
        articleId: article.id,
        userId: null,
        helpful: dto.helpful,
      }),
    );
  }

  async getArticleFeedbackSummary(slug: string): Promise<{
    helpfulYes: number;
    helpfulNo: number;
    total: number;
  }> {
    const article = await this.articleRepo.findOne({
      where: { slug, status: 'active', visibility: 'public' },
    });

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    const [helpfulYes, helpfulNo] = await Promise.all([
      this.feedbackRepo.count({
        where: { articleId: article.id, helpful: true },
      }),
      this.feedbackRepo.count({
        where: { articleId: article.id, helpful: false },
      }),
    ]);

    return {
      helpfulYes,
      helpfulNo,
      total: helpfulYes + helpfulNo,
    };
  }

  async getRelatedArticlesBySlug(
    slug: string,
    lang?: string,
    limit?: number,
  ): Promise<WikiRelatedArticleDto[]> {
    const safeLimit = limit && limit > 0 ? Math.min(limit, 12) : 6;

    const article = await this.articleRepo.findOne({
      where: { slug, status: 'active', visibility: 'public' },
    });

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    const tags = (article.tags ?? [])
      .map((t) => (t ?? '').trim())
      .filter(Boolean);
    if (!tags.length) {
      return [];
    }

    const candidates = await this.articleRepo
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.versions', 'v')
      .where('a.status = :status', { status: 'active' })
      .andWhere('a.visibility = :visibility', { visibility: 'public' })
      .andWhere('a.slug != :slug', { slug })
      .andWhere('a.tags && :tags', { tags })
      .getMany();

    const normalizedPreferredLang = lang?.trim() || undefined;
    const defaultLang = 'bg';

    const pickVersion = (
      versions: WikiArticleVersion[],
    ): WikiArticleVersion | null => {
      const published = (versions ?? []).filter((v) => v.isPublished);
      if (!published.length) return null;

      const byLang = (target: string) =>
        published.filter((v) => v.language === target);

      let selectedPool: WikiArticleVersion[] = published;

      if (normalizedPreferredLang) {
        const preferred = byLang(normalizedPreferredLang);
        if (preferred.length) {
          selectedPool = preferred;
        }
      } else {
        const defaults = byLang(defaultLang);
        if (defaults.length) {
          selectedPool = defaults;
        }
      }

      selectedPool.sort((a, b) => {
        const aTime = a.createdAt ? a.createdAt.getTime() : 0;
        const bTime = b.createdAt ? b.createdAt.getTime() : 0;
        return aTime - bTime;
      });

      return selectedPool[selectedPool.length - 1] ?? null;
    };

    const currentTagsSet = new Set(tags.map((t) => t.toLowerCase()));

    const scored = candidates
      .map((candidate) => {
        const candidateTags = (candidate.tags ?? [])
          .map((t) => (t ?? '').trim().toLowerCase())
          .filter(Boolean);

        const overlap = candidateTags.reduce(
          (acc, t) => (currentTagsSet.has(t) ? acc + 1 : acc),
          0,
        );

        const version = pickVersion(candidate.versions ?? []);
        if (!version) {
          return null;
        }

        const updatedAt =
          version.createdAt ??
          candidate.updatedAt ??
          candidate.createdAt ??
          new Date();

        const dto: WikiRelatedArticleDto = {
          slug: candidate.slug,
          language: version.language,
          title: version.title,
          updatedAt: updatedAt.toISOString(),
        };

        return {
          overlap,
          updatedAt: updatedAt.getTime(),
          dto,
        };
      })
      .filter(
        (
          row,
        ): row is {
          overlap: number;
          updatedAt: number;
          dto: WikiRelatedArticleDto;
        } => row !== null,
      );

    scored.sort((a, b) => {
      if (b.overlap !== a.overlap) return b.overlap - a.overlap;
      return b.updatedAt - a.updatedAt;
    });

    return scored.slice(0, safeLimit).map((r) => r.dto);
  }

  async getActiveArticlesList(
    page?: number,
    pageSize?: number,
    q?: string,
    lang?: string,
  ): Promise<WikiListItemDto[]> {
    const result = await this.getActiveArticlesListPaged(
      page,
      pageSize,
      q,
      lang,
    );
    return result.items;
  }

  async getActiveArticlesListPaged(
    page?: number,
    pageSize?: number,
    q?: string,
    lang?: string,
  ): Promise<{ items: WikiListItemDto[]; total: number }> {
    const safePage = page && page > 0 ? page : 1;
    const safePageSize = pageSize && pageSize > 0 ? pageSize : 20;

    const articles = await this.articleRepo.find({
      where: { status: 'active', visibility: 'public' },
      relations: ['versions'],
      order: { updatedAt: 'DESC' },
    });

    const trimmedQ = q?.trim();
    const hasSearch = !!trimmedQ;
    const hasLangFilter = !!lang;

    const allItems: WikiListItemDto[] = [];

    for (const article of articles) {
      const published = (article.versions ?? []).filter((v) => v.isPublished);
      if (!published.length) {
        continue;
      }

      let candidates = published;

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

      const availableLanguages = Array.from(
        new Set(
          published
            .map((version) => (version.language ?? '').trim())
            .filter((lng) => lng.length > 0),
        ),
      );

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

      allItems.push({
        id: article.id,
        slug: article.slug,
        language: latest.language,
        languages:
          availableLanguages.length > 0
            ? availableLanguages
            : [latest.language],
        title: latest.title,
        updatedAt: updatedAt.toISOString(),
      });
    }

    const total = allItems.length;
    const start = (safePage - 1) * safePageSize;
    const end = start + safePageSize;
    const items = total > 0 ? allItems.slice(start, end) : [];

    return { items, total };
  }

  async getAdminArticlesList(
    actorUserId: string,
    page?: number,
    pageSize?: number,
    q?: string,
    lang?: string,
  ): Promise<AdminWikiListItemDto[]> {
    const role = await this.getActiveUserRole(actorUserId);

    const articles = await this.articleRepo.find({
      where: role === 'author' ? { createdByUserId: actorUserId } : undefined,
      relations: ['versions'],
      order: { updatedAt: 'DESC' },
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
    clientIp?: string | null,
  ): Promise<WikiArticleDetailDto> {
    const article = await this.articleRepo.findOne({
      where: { slug, status: 'active', visibility: 'public' },
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

    const articleStatus = article.status;
    const isLangPublished = !!latest.isPublished;
    let languageStatus = articleStatus;

    if (articleStatus === 'inactive') {
      languageStatus = 'inactive';
    } else if (isLangPublished) {
      languageStatus = 'active';
    } else {
      languageStatus = 'draft';
    }

    void this.recordArticleView(article.id, latest.language);

    if (clientIp) {
      void this.recordArticleIpView(article.id, latest.language, clientIp);
    }

    return {
      id: article.id,
      slug: article.slug,
      visibility: article.visibility,
      tags: article.tags,
      language: latest.language,
      title: latest.title,
      subtitle: latest.subtitle ?? undefined,
      content: latest.content,
      status: articleStatus,
      articleStatus,
      languageStatus,
      updatedAt: updatedAt.toISOString(),
    };
  }

  async getArticleBySlugForAdmin(
    actorUserId: string,
    slug: string,
    lang?: string,
  ): Promise<WikiArticleDetailDto> {
    const article = await this.articleRepo.findOne({
      where: { slug },
      relations: ['versions'],
    });

    await this.requireArticleOwnershipForAuthor(actorUserId, article);

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    const versions = article.versions ?? [];
    if (!versions.length) {
      throw new NotFoundException('Article not found');
    }

    let candidates = versions;

    if (lang) {
      candidates = versions.filter((v) => v.language === lang);
    } else {
      const defaultLang = 'bg';
      const defaultCandidates = versions.filter(
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

    const articleStatus = article.status;
    const isLangPublished = !!latest.isPublished;
    let languageStatus = articleStatus;

    if (articleStatus === 'inactive') {
      languageStatus = 'inactive';
    } else if (isLangPublished) {
      languageStatus = 'active';
    } else {
      languageStatus = 'draft';
    }

    return {
      id: article.id,
      slug: article.slug,
      visibility: article.visibility,
      tags: article.tags,
      language: latest.language,
      title: latest.title,
      subtitle: latest.subtitle ?? undefined,
      content: latest.content,
      status: articleStatus,
      articleStatus,
      languageStatus,
      updatedAt: updatedAt.toISOString(),
    };
  }

  async adminListArticleMedia(
    actorUserId: string,
    articleId: string,
  ): Promise<WikiMediaItemDto[]> {
    const article = await this.articleRepo.findOne({
      where: { id: articleId },
    });

    await this.requireArticleOwnershipForAuthor(actorUserId, article);

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    const mediaDir = buildWikiArticleMediaDir(article.slug);

    let files: string[] = [];

    try {
      files = await fs.promises.readdir(mediaDir);
    } catch (error: unknown) {
      const err = error as NodeJS.ErrnoException;
      if (err && err.code === 'ENOENT') {
        return [];
      }

      throw err;
    }

    return files.map((filename) => ({
      filename,
      url: `/wiki/media/${article.slug}/${filename}`,
    }));
  }

  async adminUploadArticleMedia(
    actorUserId: string,
    articleId: string,
    file: WikiUploadedFile | undefined,
  ): Promise<WikiMediaItemDto> {
    const article = await this.articleRepo.findOne({
      where: { id: articleId },
    });

    await this.requireArticleOwnershipForAuthor(actorUserId, article);

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    if (!file) {
      throw new BadRequestException('File is required');
    }

    if (!file.mimetype || !file.mimetype.startsWith('image/')) {
      throw new BadRequestException('Only image uploads are allowed');
    }

    if (
      typeof file.size === 'number' &&
      file.size > MAX_WIKI_MEDIA_FILE_SIZE_BYTES
    ) {
      throw new BadRequestException('File is too large');
    }

    if (!file.buffer) {
      throw new BadRequestException('File buffer is missing');
    }

    const mediaDir = buildWikiArticleMediaDir(article.slug);
    await fs.promises.mkdir(mediaDir, { recursive: true });

    const incomingSize =
      typeof file.size === 'number' ? file.size : file.buffer.length;

    const originalName = file.originalname || 'image';
    const ext = path.extname(originalName).toLowerCase();
    const base = path.basename(originalName, ext);
    const safeBase = base
      .toLowerCase()
      .replace(/[^a-z0-9]+/gi, '-')
      .replace(/^-+|-+$/g, '');
    const finalBase = safeBase || 'file';

    const existingFiles = await fs.promises.readdir(mediaDir);

    for (const existingName of existingFiles) {
      const existingExt = path.extname(existingName).toLowerCase();
      if (existingExt !== ext) {
        continue;
      }

      const existingBase = path.basename(existingName, existingExt);
      const existingBaseWithoutSuffix = existingBase.replace(/-\d+$/, '');
      if (existingBaseWithoutSuffix !== finalBase) {
        continue;
      }

      const existingPath = path.join(mediaDir, existingName);
      const stat = await fs.promises.stat(existingPath);
      if (!stat.isFile() || stat.size !== incomingSize) {
        continue;
      }

      const existingBuffer = await fs.promises.readFile(existingPath);
      if (existingBuffer.equals(file.buffer)) {
        throw new BadRequestException(
          'Изображение със същото име и размер вече е качено за тази статия.',
        );
      }
    }

    const filename = sanitizeFilename(originalName);
    const filePath = path.join(mediaDir, filename);

    await fs.promises.writeFile(filePath, file.buffer);

    return {
      filename,
      url: `/wiki/media/${article.slug}/${filename}`,
    };
  }

  async adminDeleteArticleMedia(
    actorUserId: string,
    articleId: string,
    filename: string,
  ): Promise<void> {
    const article = await this.articleRepo.findOne({
      where: { id: articleId },
    });

    await this.requireArticleOwnershipForAuthor(actorUserId, article);

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    const mediaDir = buildWikiArticleMediaDir(article.slug);
    const filePath = path.join(mediaDir, filename);

    try {
      await fs.promises.unlink(filePath);
    } catch (error: unknown) {
      const err = error as NodeJS.ErrnoException;
      if (err && err.code === 'ENOENT') {
        throw new NotFoundException('Media file not found');
      }

      throw err;
    }
  }

  async adminCreateArticle(
    dto: AdminCreateWikiArticleDto,
    actorUserId: string,
  ): Promise<WikiArticleDetailDto> {
    const existingBySlug = await this.articleRepo.findOne({
      where: { slug: dto.slug },
    });

    if (existingBySlug) {
      throw new BadRequestException('Slug already exists');
    }

    const article = this.articleRepo.create({
      slug: dto.slug,
      status: dto.status,
      visibility: dto.visibility ?? 'public',
      tags: dto.tags ?? [],
      createdByUserId: actorUserId,
    });

    const savedArticle = await this.articleRepo.save(article);

    const versionsToCreate = dto.contents.map((content) =>
      this.versionRepo.create({
        article: savedArticle,
        language: content.language,
        title: content.title,
        subtitle: content.subtitle ?? null,
        content: content.content,
        versionNumber: 1,
        createdByUserId: actorUserId,
        isPublished: dto.status === 'active',
      }),
    );

    const savedVersions = await this.versionRepo.save(versionsToCreate);
    const primaryVersion = savedVersions[0];

    const updatedAt =
      (primaryVersion && primaryVersion.createdAt) ??
      savedArticle.updatedAt ??
      savedArticle.createdAt ??
      new Date();

    const articleStatus = savedArticle.status;
    const isLangPublished = !!primaryVersion.isPublished;
    let languageStatus = articleStatus;

    if (articleStatus === 'inactive') {
      languageStatus = 'inactive';
    } else if (isLangPublished) {
      languageStatus = 'active';
    } else {
      languageStatus = 'draft';
    }

    return {
      id: savedArticle.id,
      slug: savedArticle.slug,
      visibility: savedArticle.visibility,
      tags: savedArticle.tags,
      language: primaryVersion.language,
      title: primaryVersion.title,
      subtitle: primaryVersion.subtitle ?? undefined,
      content: primaryVersion.content,
      status: articleStatus,
      articleStatus,
      languageStatus,
      updatedAt: updatedAt.toISOString(),
    };
  }

  async adminUpdateArticleStatus(
    actorUserId: string,
    id: string,
    status: string,
  ): Promise<void> {
    const article = await this.articleRepo.findOne({ where: { id } });

    await this.requireArticleOwnershipForAuthor(actorUserId, article);

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    article.status = status;
    await this.articleRepo.save(article);
  }

  async adminUpdateArticle(
    id: string,
    dto: AdminUpdateWikiArticleDto,
    actorUserId: string,
  ): Promise<WikiArticleDetailDto> {
    const article = await this.articleRepo.findOne({
      where: { id },
      relations: ['versions'],
    });

    await this.requireArticleOwnershipForAuthor(actorUserId, article);

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    article.status = dto.status;
    if (dto.visibility) {
      article.visibility = dto.visibility;
    }
    if (dto.tags) {
      article.tags = dto.tags;
    }
    await this.articleRepo.save(article);

    const existingVersions = await this.versionRepo.find({
      where: {
        article: { id: article.id },
        language: dto.language,
      },
      relations: ['article'],
    });
    let primaryVersion: WikiArticleVersion;

    if (existingVersions.length > 0) {
      // Вземаме най-новата версия по versionNumber за езика
      const latestExisting = existingVersions.reduce((latest, current) => {
        const latestVersion = latest.versionNumber ?? 0;
        const currentVersion = current.versionNumber ?? 0;
        return currentVersion > latestVersion ? current : latest;
      }, existingVersions[0]);

      const currentTitle = latestExisting.title ?? '';
      const currentSubtitle = latestExisting.subtitle ?? '';
      const currentContent = latestExisting.content ?? '';
      const newSubtitle = dto.subtitle ?? '';

      const isContentChanged =
        currentTitle !== dto.title ||
        currentSubtitle !== newSubtitle ||
        currentContent !== dto.content;

      if (isContentChanged) {
        const nextVersionNumber =
          Math.max(...existingVersions.map((v) => v.versionNumber ?? 0)) + 1;

        const version = this.versionRepo.create({
          article,
          language: dto.language,
          title: dto.title,
          subtitle: dto.subtitle ?? null,
          content: dto.content,
          versionNumber: nextVersionNumber,
          createdByUserId: actorUserId,
          isPublished: dto.status === 'active',
        });

        primaryVersion = await this.versionRepo.save(version);
      } else {
        // Само статусът се е променил – не създаваме нова версия,
        // а обновяваме isPublished на последната версия за езика.
        latestExisting.isPublished = dto.status === 'active';
        primaryVersion = await this.versionRepo.save(latestExisting);
      }
    } else {
      // Няма версии за този език – задължително създаваме първа версия.
      const version = this.versionRepo.create({
        article,
        language: dto.language,
        title: dto.title,
        subtitle: dto.subtitle ?? null,
        content: dto.content,
        versionNumber: 1,
        createdByUserId: actorUserId,
        isPublished: dto.status === 'active',
      });

      primaryVersion = await this.versionRepo.save(version);
    }

    const updatedAt =
      primaryVersion.createdAt ??
      article.updatedAt ??
      article.createdAt ??
      new Date();

    const articleStatus = article.status;
    const isLangPublished = !!primaryVersion.isPublished;
    let languageStatus = articleStatus;

    if (articleStatus === 'inactive') {
      languageStatus = 'inactive';
    } else if (isLangPublished) {
      languageStatus = 'active';
    } else {
      languageStatus = 'draft';
    }

    return {
      id: article.id,
      slug: article.slug,
      visibility: article.visibility,
      tags: article.tags,
      language: primaryVersion.language,
      title: primaryVersion.title,
      subtitle: primaryVersion.subtitle ?? undefined,
      content: primaryVersion.content,
      status: articleStatus,
      articleStatus,
      languageStatus,
      updatedAt: updatedAt.toISOString(),
    };
  }

  async adminAutosaveDraft(
    id: string,
    dto: AdminAutosaveWikiDraftDto,
    actorUserId: string,
  ): Promise<void> {
    const article = await this.articleRepo.findOne({
      where: { id },
      relations: ['versions'],
    });

    await this.requireArticleOwnershipForAuthor(actorUserId, article);

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    if (article.status !== 'draft') {
      return;
    }

    const language = dto.language?.trim();
    if (!language) {
      throw new BadRequestException('Language is required');
    }

    const existingVersions = await this.versionRepo.find({
      where: {
        article: { id: article.id },
        language,
      },
      relations: ['article'],
      order: { createdAt: 'DESC', versionNumber: 'DESC' },
    });

    if (!existingVersions.length) {
      const newVersion = this.versionRepo.create({
        article,
        language,
        title: dto.title ?? '',
        subtitle: dto.subtitle ?? null,
        content: dto.content ?? '',
        versionNumber: 1,
        createdByUserId: actorUserId,
        isPublished: false,
      });

      await this.versionRepo.save(newVersion);
      return;
    }

    const latest = existingVersions[0];

    if (typeof dto.title === 'string') {
      latest.title = dto.title;
    }

    if (typeof dto.content === 'string') {
      latest.content = dto.content;
    }

    if (typeof dto.subtitle === 'string') {
      latest.subtitle = dto.subtitle;
    }

    latest.createdByUserId = actorUserId;

    await this.versionRepo.save(latest);
  }

  async getArticleVersionsForAdmin(
    actorUserId: string,
    articleId: string,
  ): Promise<AdminWikiArticleVersionDto[]> {
    const article = await this.articleRepo.findOne({
      where: { id: articleId },
    });

    await this.requireArticleOwnershipForAuthor(actorUserId, article);

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    const versions = await this.versionRepo.find({
      where: { article: { id: articleId } },
      relations: ['article'],
      order: { createdAt: 'DESC', versionNumber: 'DESC' },
    });

    const userIds = Array.from(
      new Set(
        versions
          .map((v) => v.createdByUserId)
          .filter((id): id is string => !!id),
      ),
    );

    let userMap = new Map<string, string>();

    if (userIds.length > 0) {
      const users = await this.usersRepo.find({
        where: { id: In(userIds) },
      });

      userMap = new Map(users.map((u) => [u.id, u.email]));
    }

    const articleStatus = article.status;

    return versions.map((v) => {
      const createdAt = v.createdAt
        ? v.createdAt.toISOString()
        : new Date().toISOString();

      const createdByUserId = v.createdByUserId;
      const createdBy =
        createdByUserId != null
          ? (userMap.get(createdByUserId) ?? createdByUserId)
          : null;

      const isLangPublished = !!v.isPublished;
      let status = articleStatus;

      if (articleStatus === 'inactive') {
        status = 'inactive';
      } else if (isLangPublished) {
        status = 'active';
      } else {
        status = 'draft';
      }

      return {
        id: v.id,
        version: v.versionNumber,
        language: v.language,
        title: v.title,
        subtitle: v.subtitle ?? undefined,
        content: v.content,
        createdAt,
        createdBy,
        status,
      };
    });
  }

  async restoreArticleVersionForAdmin(
    articleId: string,
    versionId: string,
    actorUserId: string,
  ): Promise<WikiArticleDetailDto> {
    const article = await this.articleRepo.findOne({
      where: { id: articleId },
    });

    await this.requireArticleOwnershipForAuthor(actorUserId, article);

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    const targetVersion = await this.versionRepo.findOne({
      where: { id: versionId, article: { id: articleId } },
      relations: ['article'],
    });

    if (!targetVersion) {
      throw new NotFoundException('Version not found');
    }

    const now = new Date();

    targetVersion.createdByUserId = actorUserId;

    if (article.status === 'active') {
      targetVersion.isPublished = true;
    }

    targetVersion.createdAt = now;

    const savedVersion = await this.versionRepo.save(targetVersion);

    const updatedAt =
      savedVersion.createdAt ?? article.updatedAt ?? article.createdAt ?? now;

    const articleStatus = article.status;
    const isLangPublished = !!savedVersion.isPublished;
    let languageStatus = articleStatus;

    if (articleStatus === 'inactive') {
      languageStatus = 'inactive';
    } else if (isLangPublished) {
      languageStatus = 'active';
    } else {
      languageStatus = 'draft';
    }

    return {
      id: article.id,
      slug: article.slug,
      language: savedVersion.language,
      title: savedVersion.title,
      content: savedVersion.content,
      status: articleStatus,
      articleStatus,
      languageStatus,
      updatedAt: updatedAt.toISOString(),
    };
  }

  async adminDeleteArticle(actorUserId: string, id: string): Promise<void> {
    const article = await this.articleRepo.findOne({ where: { id } });

    await this.requireArticleOwnershipForAuthor(actorUserId, article);

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    if (article.status === 'active') {
      throw new BadRequestException(
        'Cannot delete an active article; set status to inactive first',
      );
    }

    await this.articleRepo.remove(article);
  }

  async adminDeleteArticleVersion(
    actorUserId: string,
    articleId: string,
    versionId: string,
  ): Promise<void> {
    const article = await this.articleRepo.findOne({
      where: { id: articleId },
      relations: ['versions'],
    });

    await this.requireArticleOwnershipForAuthor(actorUserId, article);

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    const versions = article.versions ?? [];

    if (!versions.length) {
      throw new NotFoundException('Version not found');
    }

    const versionToDelete = versions.find((v) => v.id === versionId);

    if (!versionToDelete) {
      throw new NotFoundException('Version not found');
    }

    const versionsForLanguage = versions.filter(
      (v) => v.language === versionToDelete.language,
    );

    const latestForLanguage = versionsForLanguage.reduce((latest, current) => {
      const latestVersion = latest.versionNumber ?? 0;
      const currentVersion = current.versionNumber ?? 0;
      if (currentVersion !== latestVersion) {
        return currentVersion > latestVersion ? current : latest;
      }

      const latestTime = latest.createdAt ? latest.createdAt.getTime() : 0;
      const currentTime = current.createdAt ? current.createdAt.getTime() : 0;
      return currentTime > latestTime ? current : latest;
    }, versionsForLanguage[0]);

    if (latestForLanguage && latestForLanguage.id === versionToDelete.id) {
      throw new BadRequestException(
        'Cannot delete the current active version of this article',
      );
    }

    if (versions.length <= 1) {
      throw new BadRequestException(
        'Cannot delete the last remaining version of this article',
      );
    }

    await this.versionRepo.remove(versionToDelete);
  }
}
