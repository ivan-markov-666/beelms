import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { In, Repository } from 'typeorm';
import { WikiArticle } from './wiki-article.entity';
import { WikiArticleVersion } from './wiki-article-version.entity';
import { User } from '../auth/user.entity';
import { WikiListItemDto } from './dto/wiki-list-item.dto';
import { AdminWikiListItemDto } from './dto/admin-wiki-list-item.dto';
import { WikiArticleDetailDto } from './dto/wiki-article-detail.dto';
import { AdminUpdateWikiArticleDto } from './dto/admin-update-wiki-article.dto';
import { AdminCreateWikiArticleDto } from './dto/admin-create-wiki-article.dto';
import { AdminWikiArticleVersionDto } from './dto/admin-wiki-article-version.dto';
import { AdminAutosaveWikiDraftDto } from './dto/admin-autosave-wiki-draft.dto';
import { WikiMediaItemDto } from './dto/wiki-media-item.dto';

const DEFAULT_MEDIA_ROOT = path.join(process.cwd(), 'media');
const WIKI_MEDIA_SUBDIR = 'wiki';
const MAX_WIKI_MEDIA_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

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

@Injectable()
export class WikiService {
  constructor(
    @InjectRepository(WikiArticle)
    private readonly articleRepo: Repository<WikiArticle>,
    @InjectRepository(WikiArticleVersion)
    private readonly versionRepo: Repository<WikiArticleVersion>,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
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
      where: { status: 'active', visibility: 'public' },
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
    const articles = await this.articleRepo.find({
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
    slug: string,
    lang?: string,
  ): Promise<WikiArticleDetailDto> {
    const article = await this.articleRepo.findOne({
      where: { slug },
      relations: ['versions'],
    });

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

  async adminListArticleMedia(articleId: string): Promise<WikiMediaItemDto[]> {
    const article = await this.articleRepo.findOne({
      where: { id: articleId },
    });

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
    articleId: string,
    file: WikiUploadedFile | undefined,
  ): Promise<WikiMediaItemDto> {
    const article = await this.articleRepo.findOne({
      where: { id: articleId },
    });

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
    articleId: string,
    filename: string,
  ): Promise<void> {
    const article = await this.articleRepo.findOne({
      where: { id: articleId },
    });

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
    userId: string | null,
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
        createdByUserId: userId,
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

  async adminUpdateArticleStatus(id: string, status: string): Promise<void> {
    const article = await this.articleRepo.findOne({ where: { id } });

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    article.status = status;
    await this.articleRepo.save(article);
  }

  async adminUpdateArticle(
    id: string,
    dto: AdminUpdateWikiArticleDto,
    userId: string | null,
  ): Promise<WikiArticleDetailDto> {
    const article = await this.articleRepo.findOne({
      where: { id },
      relations: ['versions'],
    });

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
          createdByUserId: userId,
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
        createdByUserId: userId,
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
    userId: string | null,
  ): Promise<void> {
    const article = await this.articleRepo.findOne({
      where: { id },
      relations: ['versions'],
    });

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
        createdByUserId: userId,
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

    if (userId) {
      latest.createdByUserId = userId;
    }

    await this.versionRepo.save(latest);
  }

  async getArticleVersionsForAdmin(
    articleId: string,
  ): Promise<AdminWikiArticleVersionDto[]> {
    const article = await this.articleRepo.findOne({
      where: { id: articleId },
    });

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
    userId: string | null,
  ): Promise<WikiArticleDetailDto> {
    const article = await this.articleRepo.findOne({
      where: { id: articleId },
    });

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

    if (userId) {
      targetVersion.createdByUserId = userId;
    }

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

  async adminDeleteArticle(id: string): Promise<void> {
    const article = await this.articleRepo.findOne({ where: { id } });

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
    articleId: string,
    versionId: string,
  ): Promise<void> {
    const article = await this.articleRepo.findOne({
      where: { id: articleId },
      relations: ['versions'],
    });

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
