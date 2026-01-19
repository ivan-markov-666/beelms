import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Header,
  Param,
  ParseEnumPipe,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import type { Request } from 'express';
import * as path from 'path';
import * as fs from 'fs';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { SettingsService } from './settings.service';
import { AdminUpdateInstanceSettingsDto } from './dto/admin-update-instance-settings.dto';
import type {
  InstanceBranding,
  InstanceFeatures,
  InstanceLanguages,
  InstanceSeo,
  SocialProviderName,
} from './instance-config.entity';
import {
  SocialLoginAvailabilityService,
  type SocialProviderStatus,
} from '../auth/social-login-availability.service';
import { SocialProviderDiagnosticsService } from './social-provider-diagnostics.service';
import type { SocialProviderTestResult } from './social-provider-diagnostics.service';

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

type BrandingUploadedFile = {
  mimetype?: string;
  size?: number;
  buffer?: Buffer;
  originalname?: string;
};

const BRANDING_MEDIA_PREFIX = '/branding/media/';

type AdminSettingsResponse = {
  branding: InstanceBranding;
  features: InstanceFeatures;
  languages: InstanceLanguages;
  seo: InstanceSeo | null;
  socialProviders: Record<SocialProviderName, SocialProviderStatus>;
  socialCredentials: Partial<
    Record<
      SocialProviderName,
      {
        clientId: string | null;
        redirectUri: string | null;
        hasClientSecret: boolean;
        notes: string | null;
        updatedBy: string | null;
        updatedAt: string | null;
      }
    >
  >;
};

const SOCIAL_PROVIDER_PARAM = {
  google: 'google',
  facebook: 'facebook',
  github: 'github',
  linkedin: 'linkedin',
} as const satisfies Record<string, SocialProviderName>;

@Controller('admin/settings')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminSettingsController {
  constructor(
    private readonly settingsService: SettingsService,
    private readonly socialAvailability: SocialLoginAvailabilityService,
    private readonly socialDiagnostics: SocialProviderDiagnosticsService,
  ) {}

  @Get()
  @Header('Cache-Control', 'no-store')
  async getSettings(): Promise<AdminSettingsResponse> {
    const cfg = await this.settingsService.getOrCreateInstanceConfig();
    const socialProviders = await this.socialAvailability.getProviderStatuses(
      cfg.features,
    );
    const socialCredentials =
      await this.settingsService.getSanitizedSocialCredentials();

    return {
      branding: cfg.branding,
      features: cfg.features,
      languages: cfg.languages,
      seo: cfg.seo ?? null,
      socialProviders,
      socialCredentials,
    };
  }

  @Patch()
  @Header('Cache-Control', 'no-store')
  async patchSettings(
    @Body() dto: AdminUpdateInstanceSettingsDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<AdminSettingsResponse> {
    const updated = await this.settingsService.updateInstanceConfig(dto, {
      updatedBy: req.user?.email ?? req.user?.userId ?? null,
    });
    const socialProviders = await this.socialAvailability.getProviderStatuses(
      updated.features,
    );
    const socialCredentials =
      await this.settingsService.getSanitizedSocialCredentials();

    return {
      branding: updated.branding,
      features: updated.features,
      languages: updated.languages,
      seo: updated.seo ?? null,
      socialProviders,
      socialCredentials,
    };
  }

  @Post('branding/footer-social-icon')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFooterSocialIcon(
    @UploadedFile() file: BrandingUploadedFile | undefined,
    @Body('variant') variant?: string,
    @Body('id') id?: string,
    @Body('previousUrl') previousUrl?: string,
  ): Promise<{ url: string }> {
    const allowedMimeTypes = [
      'image/png',
      'image/jpeg',
      'image/webp',
      'image/svg+xml',
    ];

    const normalizedVariantRaw = (variant ?? '').trim().toLowerCase();
    const normalizedVariant =
      normalizedVariantRaw === 'dark' ? 'dark' : 'light';

    const normalizedId = (id ?? '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '-')
      .slice(0, 64);

    if (!normalizedId) {
      throw new BadRequestException('id is required');
    }

    const url = await this.handleBrandingImageUpload(file, {
      prefix: `footer-social-${normalizedVariant}-${normalizedId}`,
      maxBytes: 256 * 1024,
      allowedMimeTypes,
    });

    this.deletePreviousBrandingFile(previousUrl);

    return { url };
  }

  @Post('languages/icon')
  @UseInterceptors(FileInterceptor('file'))
  async uploadLanguageIcon(
    @UploadedFile() file: BrandingUploadedFile | undefined,
    @Body('variant') variant?: string,
    @Body('lang') lang?: string,
    @Body('previousUrl') previousUrl?: string,
  ): Promise<{ url: string }> {
    const allowedMimeTypes = [
      'image/png',
      'image/jpeg',
      'image/webp',
      'image/svg+xml',
    ];

    const normalizedVariantRaw = (variant ?? '').trim().toLowerCase();
    const normalizedVariant =
      normalizedVariantRaw === 'dark' ? 'dark' : 'light';

    const normalizedLang = (lang ?? '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '-')
      .slice(0, 16);

    if (!normalizedLang) {
      throw new BadRequestException('lang is required');
    }

    const url = await this.handleBrandingImageUpload(file, {
      prefix: `lang-${normalizedLang}-${normalizedVariant}`,
      maxBytes: 128 * 1024,
      allowedMimeTypes,
    });

    this.deletePreviousBrandingFile(previousUrl);

    return { url };
  }

  @Post('branding/social-login-icon')
  @UseInterceptors(FileInterceptor('file'))
  async uploadSocialLoginIcon(
    @UploadedFile() file: BrandingUploadedFile | undefined,
    @Body('variant') variant?: string,
    @Body('provider') provider?: string,
    @Body('previousUrl') previousUrl?: string,
  ): Promise<{ url: string }> {
    const allowedMimeTypes = [
      'image/png',
      'image/jpeg',
      'image/webp',
      'image/svg+xml',
    ];

    const normalizedVariantRaw = (variant ?? '').trim().toLowerCase();
    const normalizedVariant =
      normalizedVariantRaw === 'dark' ? 'dark' : 'light';

    const normalizedProvider = (provider ?? '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '-')
      .slice(0, 32);

    const safeProvider =
      normalizedProvider === 'google' ||
      normalizedProvider === 'facebook' ||
      normalizedProvider === 'github' ||
      normalizedProvider === 'linkedin'
        ? normalizedProvider
        : null;

    if (!safeProvider) {
      throw new BadRequestException('provider is required');
    }

    const url = await this.handleBrandingImageUpload(file, {
      prefix: `social-login-${safeProvider}-${normalizedVariant}`,
      maxBytes: 256 * 1024,
      allowedMimeTypes,
    });

    this.deletePreviousBrandingFile(previousUrl);

    return { url };
  }

  @Post('social/:provider/test')
  async testSocialProvider(
    @Param('provider', new ParseEnumPipe(SOCIAL_PROVIDER_PARAM))
    provider: SocialProviderName,
  ): Promise<SocialProviderTestResult> {
    return this.socialDiagnostics.testConnection(provider);
  }

  private async handleBrandingImageUpload(
    file: BrandingUploadedFile | undefined,
    options?: {
      prefix?: string;
      maxBytes?: number;
      allowedMimeTypes?: string[];
    },
  ): Promise<string> {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const allowedMimeTypes = options?.allowedMimeTypes;
    if (Array.isArray(allowedMimeTypes) && allowedMimeTypes.length > 0) {
      if (!file.mimetype || !allowedMimeTypes.includes(file.mimetype)) {
        throw new BadRequestException('Unsupported file type');
      }
    } else if (!file.mimetype || !file.mimetype.startsWith('image/')) {
      throw new BadRequestException('Only image uploads are allowed');
    }

    const maxBytes = options?.maxBytes ?? 256 * 1024;
    const size =
      typeof file.size === 'number' ? file.size : file.buffer?.length;
    if (typeof size === 'number' && size > maxBytes) {
      throw new BadRequestException('File is too large');
    }

    if (!file.buffer) {
      throw new BadRequestException('File buffer is missing');
    }

    const defaultMediaRoot = path.join(process.cwd(), 'media');
    const mediaRootEnv = process.env.MEDIA_ROOT;
    const mediaRoot =
      mediaRootEnv && mediaRootEnv.trim().length > 0
        ? mediaRootEnv
        : defaultMediaRoot;

    const ext = path.extname(file.originalname || '').toLowerCase() || '.png';
    const prefix = options?.prefix ?? 'cursor';
    const filename = `${prefix}-${Date.now()}${ext}`;
    const dir = path.join(mediaRoot, 'branding');
    await fs.promises.mkdir(dir, { recursive: true });
    await fs.promises.writeFile(path.join(dir, filename), file.buffer);

    return `/branding/media/${filename}`;
  }

  private async handleBrandingFontUpload(
    file: BrandingUploadedFile | undefined,
    options?: { prefix?: string; maxBytes?: number },
  ): Promise<string> {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    if (!file.buffer) {
      throw new BadRequestException('File buffer is missing');
    }

    const ext = path.extname(file.originalname || '').toLowerCase();
    const allowedExts = new Set(['.woff2', '.woff', '.ttf', '.otf']);
    if (!allowedExts.has(ext)) {
      throw new BadRequestException(
        'Unsupported font type. Use WOFF2, WOFF, TTF or OTF.',
      );
    }

    const maxBytes = options?.maxBytes ?? 2 * 1024 * 1024;
    const size =
      typeof file.size === 'number' ? file.size : file.buffer?.length;
    if (typeof size === 'number' && size <= 0) {
      throw new BadRequestException('File is empty');
    }
    if (typeof size === 'number' && size > maxBytes) {
      throw new BadRequestException('File is too large');
    }

    const defaultMediaRoot = path.join(process.cwd(), 'media');
    const mediaRootEnv = process.env.MEDIA_ROOT;
    const mediaRoot =
      mediaRootEnv && mediaRootEnv.trim().length > 0
        ? mediaRootEnv
        : defaultMediaRoot;

    const prefix = options?.prefix ?? 'font';
    const filename = `${prefix}-${Date.now()}${ext}`;
    const dir = path.join(mediaRoot, 'branding');
    await fs.promises.mkdir(dir, { recursive: true });
    await fs.promises.writeFile(path.join(dir, filename), file.buffer);

    return `${BRANDING_MEDIA_PREFIX}${filename}`;
  }

  private async handleBrandingLicenseUpload(
    file: BrandingUploadedFile | undefined,
    options?: { prefix?: string; maxBytes?: number },
  ): Promise<string> {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    if (!file.buffer) {
      throw new BadRequestException('File buffer is missing');
    }

    const ext = path.extname(file.originalname || '').toLowerCase();
    const allowedExts = new Set([
      '.pdf',
      '.txt',
      '.md',
      '.rtf',
      '.doc',
      '.docx',
      '.odt',
      '.png',
      '.jpg',
      '.jpeg',
      '.webp',
      '.zip',
    ]);
    if (!allowedExts.has(ext)) {
      throw new BadRequestException(
        'Unsupported license type. Use PDF/TXT/DOC/DOCX/ODT/PNG/JPG/WEBP/ZIP.',
      );
    }

    const maxBytes = options?.maxBytes ?? 5 * 1024 * 1024;
    const size =
      typeof file.size === 'number' ? file.size : file.buffer?.length;
    if (typeof size === 'number' && size <= 0) {
      throw new BadRequestException('File is empty');
    }
    if (typeof size === 'number' && size > maxBytes) {
      throw new BadRequestException('File is too large');
    }

    const defaultMediaRoot = path.join(process.cwd(), 'media');
    const mediaRootEnv = process.env.MEDIA_ROOT;
    const mediaRoot =
      mediaRootEnv && mediaRootEnv.trim().length > 0
        ? mediaRootEnv
        : defaultMediaRoot;

    const prefix = options?.prefix ?? 'font-license';
    const filename = `${prefix}-${Date.now()}${ext}`;
    const dir = path.join(mediaRoot, 'branding');
    await fs.promises.mkdir(dir, { recursive: true });
    await fs.promises.writeFile(path.join(dir, filename), file.buffer);

    return `${BRANDING_MEDIA_PREFIX}${filename}`;
  }

  private deletePreviousBrandingFile(previousUrl?: string) {
    if (!previousUrl?.startsWith(BRANDING_MEDIA_PREFIX)) {
      return;
    }

    const previousFilename = previousUrl.replace(BRANDING_MEDIA_PREFIX, '');
    const defaultMediaRoot = path.join(process.cwd(), 'media');
    const mediaRootEnv = process.env.MEDIA_ROOT;
    const mediaRoot =
      mediaRootEnv && mediaRootEnv.trim().length > 0
        ? mediaRootEnv
        : defaultMediaRoot;
    const dir = path.join(mediaRoot, 'branding');
    const previousPath = path.join(dir, previousFilename);
    void fs.promises
      .unlink(previousPath)
      .catch(() => Promise.resolve(undefined));
  }

  @Post('branding/cursor')
  @UseInterceptors(FileInterceptor('file'))
  async uploadCursor(
    @UploadedFile() file: BrandingUploadedFile | undefined,
  ): Promise<{ url: string }> {
    const url = await this.handleBrandingImageUpload(file, {
      prefix: 'cursor',
      maxBytes: 256 * 1024,
      allowedMimeTypes: ['image/png', 'image/webp'],
    });
    return { url };
  }

  @Post('branding/cursor-light')
  @UseInterceptors(FileInterceptor('file'))
  async uploadCursorLight(
    @UploadedFile() file: BrandingUploadedFile | undefined,
    @Body('previousUrl') previousUrl?: string,
  ): Promise<{ url: string }> {
    const url = await this.handleBrandingImageUpload(file, {
      prefix: 'cursor-light',
      maxBytes: 256 * 1024,
      allowedMimeTypes: ['image/png', 'image/webp'],
    });
    this.deletePreviousBrandingFile(previousUrl);
    return { url };
  }

  @Post('branding/cursor-dark')
  @UseInterceptors(FileInterceptor('file'))
  async uploadCursorDark(
    @UploadedFile() file: BrandingUploadedFile | undefined,
    @Body('previousUrl') previousUrl?: string,
  ): Promise<{ url: string }> {
    const url = await this.handleBrandingImageUpload(file, {
      prefix: 'cursor-dark',
      maxBytes: 256 * 1024,
      allowedMimeTypes: ['image/png', 'image/webp'],
    });
    this.deletePreviousBrandingFile(previousUrl);
    return { url };
  }

  @Post('branding/cursor-pointer')
  @UseInterceptors(FileInterceptor('file'))
  async uploadCursorPointer(
    @UploadedFile() file: BrandingUploadedFile | undefined,
    @Body('previousUrl') previousUrl?: string,
  ): Promise<{ url: string }> {
    const url = await this.handleBrandingImageUpload(file, {
      prefix: 'cursor-pointer',
      maxBytes: 256 * 1024,
      allowedMimeTypes: ['image/png', 'image/webp'],
    });
    this.deletePreviousBrandingFile(previousUrl);
    return { url };
  }

  @Post('branding/cursor-pointer-light')
  @UseInterceptors(FileInterceptor('file'))
  async uploadCursorPointerLight(
    @UploadedFile() file: BrandingUploadedFile | undefined,
    @Body('previousUrl') previousUrl?: string,
  ): Promise<{ url: string }> {
    const url = await this.handleBrandingImageUpload(file, {
      prefix: 'cursor-pointer-light',
      maxBytes: 256 * 1024,
      allowedMimeTypes: ['image/png', 'image/webp'],
    });
    this.deletePreviousBrandingFile(previousUrl);
    return { url };
  }

  @Post('branding/cursor-pointer-dark')
  @UseInterceptors(FileInterceptor('file'))
  async uploadCursorPointerDark(
    @UploadedFile() file: BrandingUploadedFile | undefined,
    @Body('previousUrl') previousUrl?: string,
  ): Promise<{ url: string }> {
    const url = await this.handleBrandingImageUpload(file, {
      prefix: 'cursor-pointer-dark',
      maxBytes: 256 * 1024,
      allowedMimeTypes: ['image/png', 'image/webp'],
    });
    this.deletePreviousBrandingFile(previousUrl);
    return { url };
  }

  @Post('branding/social-image')
  @UseInterceptors(FileInterceptor('file'))
  async uploadSocialImage(
    @UploadedFile() file: BrandingUploadedFile | undefined,
    @Body('purpose') purpose?: string,
    @Body('previousUrl') previousUrl?: string,
  ): Promise<{ url: string }> {
    const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/webp'];
    if (file?.mimetype && !allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Unsupported image type. Use PNG, JPG/JPEG or WEBP.',
      );
    }

    const normalizedPurposeRaw = (purpose ?? '').trim().toLowerCase();
    const normalizedPurpose =
      normalizedPurposeRaw === 'twitter'
        ? 'twitter'
        : normalizedPurposeRaw === 'shared'
          ? 'shared'
          : 'open-graph';

    const url = await this.handleBrandingImageUpload(file, {
      prefix: normalizedPurpose,
      maxBytes: 1024 * 1024,
    });

    this.deletePreviousBrandingFile(previousUrl);

    return {
      url,
    };
  }

  @Post('branding/logo')
  @UseInterceptors(FileInterceptor('file'))
  async uploadLogo(
    @UploadedFile() file: BrandingUploadedFile | undefined,
    @Body('previousUrl') previousUrl?: string,
  ): Promise<{ url: string }> {
    const allowedMimeTypes = [
      'image/png',
      'image/jpeg',
      'image/webp',
      'image/svg+xml',
    ];
    const url = await this.handleBrandingImageUpload(file, {
      prefix: 'logo',
      maxBytes: 512 * 1024,
      allowedMimeTypes,
    });
    this.deletePreviousBrandingFile(previousUrl);
    return { url };
  }

  @Post('branding/logo-light')
  @UseInterceptors(FileInterceptor('file'))
  async uploadLogoLight(
    @UploadedFile() file: BrandingUploadedFile | undefined,
    @Body('previousUrl') previousUrl?: string,
  ): Promise<{ url: string }> {
    const allowedMimeTypes = [
      'image/png',
      'image/jpeg',
      'image/webp',
      'image/svg+xml',
    ];
    const url = await this.handleBrandingImageUpload(file, {
      prefix: 'logo-light',
      maxBytes: 512 * 1024,
      allowedMimeTypes,
    });
    this.deletePreviousBrandingFile(previousUrl);
    return { url };
  }

  @Post('branding/logo-dark')
  @UseInterceptors(FileInterceptor('file'))
  async uploadLogoDark(
    @UploadedFile() file: BrandingUploadedFile | undefined,
    @Body('previousUrl') previousUrl?: string,
  ): Promise<{ url: string }> {
    const allowedMimeTypes = [
      'image/png',
      'image/jpeg',
      'image/webp',
      'image/svg+xml',
    ];
    const url = await this.handleBrandingImageUpload(file, {
      prefix: 'logo-dark',
      maxBytes: 512 * 1024,
      allowedMimeTypes,
    });
    this.deletePreviousBrandingFile(previousUrl);
    return { url };
  }

  @Post('branding/favicon')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFavicon(
    @UploadedFile() file: BrandingUploadedFile | undefined,
    @Body('previousUrl') previousUrl?: string,
  ): Promise<{ url: string }> {
    const allowedMimeTypes = [
      'image/png',
      'image/x-icon',
      'image/vnd.microsoft.icon',
    ];
    const url = await this.handleBrandingImageUpload(file, {
      prefix: 'favicon',
      maxBytes: 128 * 1024,
      allowedMimeTypes,
    });
    this.deletePreviousBrandingFile(previousUrl);
    return { url };
  }

  @Post('branding/font')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFont(
    @UploadedFile() file: BrandingUploadedFile | undefined,
    @Body('previousUrl') previousUrl?: string,
  ): Promise<{ url: string }> {
    const url = await this.handleBrandingFontUpload(file, {
      prefix: 'font',
      maxBytes: 2 * 1024 * 1024,
    });
    this.deletePreviousBrandingFile(previousUrl);
    return { url };
  }

  @Post('branding/font-license')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFontLicense(
    @UploadedFile() file: BrandingUploadedFile | undefined,
    @Body('previousUrl') previousUrl?: string,
  ): Promise<{ url: string }> {
    const url = await this.handleBrandingLicenseUpload(file, {
      prefix: 'font-license',
      maxBytes: 5 * 1024 * 1024,
    });
    this.deletePreviousBrandingFile(previousUrl);
    return { url };
  }
}
