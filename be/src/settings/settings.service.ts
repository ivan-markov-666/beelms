import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  InstanceBranding,
  InstanceConfig,
  InstanceFeatures,
  InstanceLanguages,
  InstanceSeo,
  InstanceSocialCredentials,
  SocialProviderCredentials,
  type SocialProviderName,
} from './instance-config.entity';
import type {
  AdminUpdateInstanceSettingsDto,
  AdminUpdateSocialCredentialsDto,
} from './dto/admin-update-instance-settings.dto';

const SOCIAL_PROVIDER_ENV_MAP: Record<
  SocialProviderName,
  { clientId: string; clientSecret: string; redirectUri: string }
> = {
  google: {
    clientId: 'GOOGLE_CLIENT_ID',
    clientSecret: 'GOOGLE_CLIENT_SECRET',
    redirectUri: 'GOOGLE_OAUTH_REDIRECT_URL',
  },
  facebook: {
    clientId: 'FACEBOOK_APP_ID',
    clientSecret: 'FACEBOOK_APP_SECRET',
    redirectUri: 'FACEBOOK_OAUTH_REDIRECT_URL',
  },
  github: {
    clientId: 'GITHUB_CLIENT_ID',
    clientSecret: 'GITHUB_CLIENT_SECRET',
    redirectUri: 'GITHUB_OAUTH_REDIRECT_URL',
  },
  linkedin: {
    clientId: 'LINKEDIN_CLIENT_ID',
    clientSecret: 'LINKEDIN_CLIENT_SECRET',
    redirectUri: 'LINKEDIN_OAUTH_REDIRECT_URL',
  },
};

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(InstanceConfig)
    private readonly instanceConfigRepo: Repository<InstanceConfig>,
  ) {}

  private buildDefaultBranding(): InstanceBranding {
    return {
      appName: 'BeeLMS',
      browserTitle: 'BeeLMS',
      cursorUrl: null,
      cursorLightUrl: null,
      cursorDarkUrl: null,
      cursorHotspot: null,
      faviconUrl: null,
      googleFont: null,
      googleFontByLang: null,
      fontUrl: null,
      fontUrlByLang: null,
      fontLicenseUrl: null,
      fontLicenseUrlByLang: null,
      customThemePresets: null,
      theme: {
        mode: 'system',
        light: {
          background: '#ffffff',
          foreground: '#171717',
          primary: '#16a34a',
          secondary: '#2563eb',
          error: '#dc2626',
          card: '#ffffff',
          border: '#e5e7eb',
          scrollThumb: '#86efac',
          scrollTrack: '#f0fdf4',
          fieldOkBg: '#f0fdf4',
          fieldOkBorder: '#dcfce7',
          fieldErrorBg: '#fef2f2',
          fieldErrorBorder: '#fee2e2',
        },
        dark: {
          background: '#0a0a0a',
          foreground: '#ededed',
          primary: '#22c55e',
          secondary: '#60a5fa',
          error: '#f87171',
          card: '#111827',
          border: '#374151',
          scrollThumb: '#16a34a',
          scrollTrack: '#0b2a16',
          fieldOkBg: '#052e16',
          fieldOkBorder: '#14532d',
          fieldErrorBg: '#450a0a',
          fieldErrorBorder: '#7f1d1d',
        },
      },
      logoUrl: null,
      logoLightUrl: null,
      logoDarkUrl: null,
      primaryColor: null,
      socialImage: null,
      socialDescription: null,
      openGraph: null,
      twitter: null,
    };
  }

  private buildDefaultSeo(): InstanceSeo {
    return {
      baseUrl: null,
      titleTemplate: '{page} | {site}',
      defaultTitle: null,
      defaultDescription: null,
      robots: {
        index: true,
      },
      sitemap: {
        enabled: true,
        includeWiki: true,
        includeCourses: true,
        includeLegal: true,
      },
      openGraph: {
        defaultTitle: null,
        defaultDescription: null,
        imageUrl: null,
      },
      twitter: {
        card: 'summary_large_image',
        defaultTitle: null,
        defaultDescription: null,
        imageUrl: null,
      },
    };
  }

  private buildDefaultFeatures(): InstanceFeatures {
    return {
      wiki: true,
      wikiPublic: true,
      courses: true,
      coursesPublic: true,
      myCourses: true,
      profile: true,
      accessibilityWidget: true,
      seo: true,
      themeLight: true,
      themeDark: true,
      themeModeSelector: true,
      auth: true,
      authLogin: true,
      authRegister: true,
      captcha: false,
      captchaLogin: false,
      captchaRegister: false,
      captchaForgotPassword: false,
      captchaChangePassword: false,
      paidCourses: true,
      gdprLegal: true,
      socialGoogle: true,
      socialFacebook: true,
      socialGithub: true,
      socialLinkedin: true,
      infraRedis: false,
      infraRabbitmq: false,
      infraMonitoring: true,
      infraErrorTracking: false,
    };
  }

  private buildDefaultLanguages(): InstanceLanguages {
    return {
      supported: ['bg', 'en', 'de'],
      default: 'bg',
    };
  }

  private buildDefaultSocialCredentials(): InstanceSocialCredentials | null {
    const entries:
      | Partial<Record<SocialProviderName, SocialProviderCredentials>>
      | undefined = this.buildEnvSocialCredentialEntries();

    return entries && Object.keys(entries).length > 0 ? entries : null;
  }

  async getOrCreateInstanceConfig(): Promise<InstanceConfig> {
    const [existing] = await this.instanceConfigRepo.find({
      order: { createdAt: 'ASC' },
      take: 1,
    });

    if (existing) {
      let changed = false;

      const mergedFeatures = {
        ...this.buildDefaultFeatures(),
        ...(existing.features ?? {}),
      };
      for (const [k, v] of Object.entries(mergedFeatures)) {
        if ((existing.features as Record<string, unknown>)[k] !== v) {
          changed = true;
          break;
        }
      }
      if (changed) {
        existing.features = mergedFeatures;
      }

      if (!existing.seo) {
        existing.seo = this.buildDefaultSeo();
        changed = true;
      }

      return changed ? this.instanceConfigRepo.save(existing) : existing;
    }

    const created = this.instanceConfigRepo.create({
      branding: this.buildDefaultBranding(),
      features: this.buildDefaultFeatures(),
      languages: this.buildDefaultLanguages(),
      seo: this.buildDefaultSeo(),
      socialCredentials: this.buildDefaultSocialCredentials(),
    });

    return this.instanceConfigRepo.save(created);
  }

  async updateInstanceConfig(
    dto: AdminUpdateInstanceSettingsDto,
    options?: { updatedBy?: string | null },
  ): Promise<InstanceConfig> {
    const cfg = await this.getOrCreateInstanceConfig();
    const updatedBy = options?.updatedBy ?? null;

    const features = {
      ...this.buildDefaultFeatures(),
      ...(cfg.features ?? {}),
      ...(dto.features ?? {}),
    };

    if (features.themeLight === false && features.themeDark === false) {
      throw new BadRequestException(
        'At least one of features.themeLight or features.themeDark must be enabled',
      );
    }

    if (features.courses === false) {
      features.coursesPublic = false;
      features.myCourses = false;
    }

    if (features.wiki === false) {
      features.wikiPublic = false;
    }

    if (features.captcha === false) {
      features.captchaLogin = false;
      features.captchaRegister = false;
      features.captchaForgotPassword = false;
      features.captchaChangePassword = false;
    }

    const languages = dto.languages
      ? {
          ...cfg.languages,
          ...dto.languages,
        }
      : cfg.languages;

    const socialCredentials = dto.socialCredentials
      ? this.mergeSocialCredentials(
          cfg.socialCredentials ?? null,
          dto.socialCredentials,
          updatedBy,
        )
      : (cfg.socialCredentials ?? null);

    if (!Array.isArray(languages.supported) || languages.supported.length < 1) {
      throw new BadRequestException(
        'languages.supported must contain at least 1 language',
      );
    }

    if (!languages.supported.includes(languages.default)) {
      throw new BadRequestException(
        'languages.default must be included in languages.supported',
      );
    }

    const branding = dto.branding
      ? this.normalizeBranding(this.mergeBranding(cfg.branding, dto.branding), {
          supportedLangs: languages.supported,
        })
      : cfg.branding;

    const seo = dto.seo
      ? this.normalizeSeo(
          this.mergeSeo(
            cfg.seo ?? this.buildDefaultSeo(),
            dto.seo as unknown as Partial<InstanceSeo>,
          ),
        )
      : (cfg.seo ?? this.buildDefaultSeo());

    cfg.branding = branding;
    cfg.features = features;
    cfg.languages = languages;
    cfg.seo = seo;
    cfg.socialCredentials = socialCredentials;

    return this.instanceConfigRepo.save(cfg);
  }

  private mergeSeo(
    current: InstanceSeo | null,
    update: Partial<InstanceSeo>,
  ): InstanceSeo {
    const base: InstanceSeo = { ...(current ?? {}) };
    const next: InstanceSeo = { ...base, ...(update ?? {}) };

    if (Object.prototype.hasOwnProperty.call(update, 'robots')) {
      if (update.robots === null) {
        next.robots = null;
      } else if (typeof update.robots !== 'undefined') {
        next.robots = {
          ...(base.robots ?? {}),
          ...(update.robots ?? {}),
        };
      }
    }

    if (Object.prototype.hasOwnProperty.call(update, 'sitemap')) {
      if (update.sitemap === null) {
        next.sitemap = null;
      } else if (typeof update.sitemap !== 'undefined') {
        next.sitemap = {
          ...(base.sitemap ?? {}),
          ...(update.sitemap ?? {}),
        };
      }
    }

    if (Object.prototype.hasOwnProperty.call(update, 'openGraph')) {
      if (update.openGraph === null) {
        next.openGraph = null;
      } else if (typeof update.openGraph !== 'undefined') {
        next.openGraph = {
          ...(base.openGraph ?? {}),
          ...(update.openGraph ?? {}),
        };
      }
    }

    if (Object.prototype.hasOwnProperty.call(update, 'twitter')) {
      if (update.twitter === null) {
        next.twitter = null;
      } else if (typeof update.twitter !== 'undefined') {
        next.twitter = {
          ...(base.twitter ?? {}),
          ...(update.twitter ?? {}),
        };
      }
    }

    return next;
  }

  private normalizeSeo(seo: InstanceSeo): InstanceSeo {
    const next: InstanceSeo = { ...seo };

    const normalizeUrl = (value: string | null | undefined): string | null => {
      const v = this.normalizeNullableString(value);
      if (typeof v !== 'string') return null;
      const trimmed = v.trim();
      if (!trimmed) return null;
      return trimmed.endsWith('/') ? trimmed.slice(0, -1) : trimmed;
    };

    const normalizeTemplate = (
      value: string | null | undefined,
    ): string | null => {
      const v = this.normalizeNullableString(value);
      if (typeof v !== 'string') return null;
      const trimmed = v.trim();
      if (!trimmed) return null;
      // Keep it safe: only allow placeholders {site} and {page}
      const allowedChars = /^[\w\s\-|_{}.:]+$/;
      if (!allowedChars.test(trimmed)) return '{page} | {site}';
      if (!trimmed.includes('{site}') && !trimmed.includes('{page}')) {
        return '{page} | {site}';
      }
      return trimmed;
    };

    next.baseUrl = normalizeUrl(next.baseUrl);
    next.titleTemplate =
      normalizeTemplate(next.titleTemplate) ?? '{page} | {site}';
    next.defaultTitle = this.normalizeNullableString(next.defaultTitle) ?? null;
    next.defaultDescription =
      this.normalizeNullableString(next.defaultDescription) ?? null;

    if (next.robots) {
      next.robots = {
        index:
          typeof next.robots.index === 'boolean' ? next.robots.index : true,
      };
    }

    if (next.sitemap) {
      next.sitemap = {
        enabled:
          typeof next.sitemap.enabled === 'boolean'
            ? next.sitemap.enabled
            : true,
        includeWiki:
          typeof next.sitemap.includeWiki === 'boolean'
            ? next.sitemap.includeWiki
            : true,
        includeCourses:
          typeof next.sitemap.includeCourses === 'boolean'
            ? next.sitemap.includeCourses
            : true,
        includeLegal:
          typeof next.sitemap.includeLegal === 'boolean'
            ? next.sitemap.includeLegal
            : true,
      };
    }

    if (next.openGraph) {
      next.openGraph = {
        defaultTitle:
          this.normalizeNullableString(next.openGraph.defaultTitle) ?? null,
        defaultDescription:
          this.normalizeNullableString(next.openGraph.defaultDescription) ??
          null,
        imageUrl: normalizeUrl(next.openGraph.imageUrl),
      };
    }

    if (next.twitter) {
      const rawCard = next.twitter.card ?? null;
      const card =
        rawCard === 'summary' || rawCard === 'summary_large_image'
          ? rawCard
          : 'summary_large_image';

      next.twitter = {
        card,
        defaultTitle:
          this.normalizeNullableString(next.twitter.defaultTitle) ?? null,
        defaultDescription:
          this.normalizeNullableString(next.twitter.defaultDescription) ?? null,
        imageUrl: normalizeUrl(next.twitter.imageUrl),
      };
    }

    return next;
  }

  private mergeBranding(
    current: InstanceBranding,
    update: Partial<InstanceBranding>,
  ): InstanceBranding {
    const next: InstanceBranding = { ...current };

    for (const key of Object.keys(update) as Array<keyof InstanceBranding>) {
      const value = update[key];
      if (typeof value !== 'undefined') {
        (next as Record<string, unknown>)[key as string] = value;
      }
    }

    if (Object.prototype.hasOwnProperty.call(update, 'theme')) {
      if (update.theme === null) {
        next.theme = null;
      } else if (typeof update.theme !== 'undefined') {
        next.theme = {
          ...(current.theme ?? {}),
          ...(update.theme ?? {}),
          ...(update.theme &&
          Object.prototype.hasOwnProperty.call(update.theme, 'light')
            ? {
                light:
                  update.theme.light === null
                    ? null
                    : {
                        ...(current.theme?.light ?? {}),
                        ...(update.theme.light ?? {}),
                      },
              }
            : {}),
          ...(update.theme &&
          Object.prototype.hasOwnProperty.call(update.theme, 'dark')
            ? {
                dark:
                  update.theme.dark === null
                    ? null
                    : {
                        ...(current.theme?.dark ?? {}),
                        ...(update.theme.dark ?? {}),
                      },
              }
            : {}),
        };
      }
    }

    if (Object.prototype.hasOwnProperty.call(update, 'cursorHotspot')) {
      if (update.cursorHotspot === null) {
        next.cursorHotspot = null;
      } else if (typeof update.cursorHotspot !== 'undefined') {
        next.cursorHotspot = {
          ...(current.cursorHotspot ?? {}),
          ...(update.cursorHotspot ?? {}),
        };
      }
    }

    if (Object.prototype.hasOwnProperty.call(update, 'googleFontByLang')) {
      if (update.googleFontByLang === null) {
        next.googleFontByLang = null;
      } else if (
        typeof update.googleFontByLang !== 'undefined' &&
        update.googleFontByLang &&
        typeof update.googleFontByLang === 'object'
      ) {
        next.googleFontByLang = {
          ...(current.googleFontByLang ?? {}),
          ...(update.googleFontByLang ?? {}),
        };
      }
    }

    if (Object.prototype.hasOwnProperty.call(update, 'fontUrlByLang')) {
      if (update.fontUrlByLang === null) {
        next.fontUrlByLang = null;
      } else if (
        typeof update.fontUrlByLang !== 'undefined' &&
        update.fontUrlByLang &&
        typeof update.fontUrlByLang === 'object'
      ) {
        next.fontUrlByLang = {
          ...(current.fontUrlByLang ?? {}),
          ...(update.fontUrlByLang ?? {}),
        };
      }
    }

    if (Object.prototype.hasOwnProperty.call(update, 'fontLicenseUrlByLang')) {
      if (update.fontLicenseUrlByLang === null) {
        next.fontLicenseUrlByLang = null;
      } else if (
        typeof update.fontLicenseUrlByLang !== 'undefined' &&
        update.fontLicenseUrlByLang &&
        typeof update.fontLicenseUrlByLang === 'object'
      ) {
        next.fontLicenseUrlByLang = {
          ...(current.fontLicenseUrlByLang ?? {}),
          ...(update.fontLicenseUrlByLang ?? {}),
        };
      }
    }

    if (Object.prototype.hasOwnProperty.call(update, 'socialImage')) {
      if (update.socialImage === null) {
        next.socialImage = null;
      } else if (typeof update.socialImage !== 'undefined') {
        next.socialImage = {
          ...(current.socialImage ?? {}),
          ...(update.socialImage ?? {}),
        };
      }
    }

    if (Object.prototype.hasOwnProperty.call(update, 'openGraph')) {
      if (update.openGraph === null) {
        next.openGraph = null;
      } else if (typeof update.openGraph !== 'undefined') {
        next.openGraph = {
          ...(current.openGraph ?? {}),
          ...(update.openGraph ?? {}),
        };
      }
    }

    if (Object.prototype.hasOwnProperty.call(update, 'twitter')) {
      if (update.twitter === null) {
        next.twitter = null;
      } else if (typeof update.twitter !== 'undefined') {
        const mergedTwitter = {
          ...(current.twitter ?? {}),
          ...(update.twitter ?? {}),
        };

        if (
          update.twitter &&
          Object.prototype.hasOwnProperty.call(update.twitter, 'app')
        ) {
          if (update.twitter.app === null) {
            mergedTwitter.app = null;
          } else if (typeof update.twitter.app !== 'undefined') {
            const mergedApp = {
              ...(current.twitter?.app ?? {}),
              ...(update.twitter.app ?? {}),
            };

            if (
              update.twitter.app &&
              Object.prototype.hasOwnProperty.call(update.twitter.app, 'id')
            ) {
              if (update.twitter.app.id === null) {
                mergedApp.id = null;
              } else if (typeof update.twitter.app.id !== 'undefined') {
                mergedApp.id = {
                  ...(current.twitter?.app?.id ?? {}),
                  ...(update.twitter.app.id ?? {}),
                };
              }
            }

            if (
              update.twitter.app &&
              Object.prototype.hasOwnProperty.call(update.twitter.app, 'url')
            ) {
              if (update.twitter.app.url === null) {
                mergedApp.url = null;
              } else if (typeof update.twitter.app.url !== 'undefined') {
                mergedApp.url = {
                  ...(current.twitter?.app?.url ?? {}),
                  ...(update.twitter.app.url ?? {}),
                };
              }
            }

            mergedTwitter.app = mergedApp;
          }
        }

        if (
          update.twitter &&
          Object.prototype.hasOwnProperty.call(update.twitter, 'player')
        ) {
          if (update.twitter.player === null) {
            mergedTwitter.player = null;
          } else if (typeof update.twitter.player !== 'undefined') {
            mergedTwitter.player = {
              ...(current.twitter?.player ?? {}),
              ...(update.twitter.player ?? {}),
            };
          }
        }

        next.twitter = mergedTwitter;
      }
    }

    return next;
  }

  private normalizeNullableString(
    value: string | null | undefined,
    options?: { lower?: boolean },
  ): string | null | undefined {
    if (typeof value === 'undefined') {
      return undefined;
    }
    if (value === null) {
      return null;
    }
    const trimmed = value.trim();
    if (trimmed.length < 1) {
      return null;
    }
    return options?.lower ? trimmed.toLowerCase() : trimmed;
  }

  private normalizeBranding(
    branding: InstanceBranding,
    options?: { supportedLangs?: string[] },
  ): InstanceBranding {
    const next: InstanceBranding = { ...branding };

    type Twitter = NonNullable<InstanceBranding['twitter']>;
    type TwitterApp = NonNullable<NonNullable<Twitter['app']>>;
    type TwitterPlayer = NonNullable<NonNullable<Twitter['player']>>;

    if (typeof next.browserTitle !== 'undefined') {
      next.browserTitle =
        this.normalizeNullableString(next.browserTitle) ?? null;
    }
    if (typeof next.notFoundTitle !== 'undefined') {
      next.notFoundTitle =
        this.normalizeNullableString(next.notFoundTitle) ?? null;
    }
    if (typeof next.notFoundMarkdown !== 'undefined') {
      next.notFoundMarkdown =
        this.normalizeNullableString(next.notFoundMarkdown) ?? null;
    }
    if (typeof next.cursorUrl !== 'undefined') {
      next.cursorUrl = this.normalizeNullableString(next.cursorUrl) ?? null;
    }
    if (typeof next.cursorLightUrl !== 'undefined') {
      next.cursorLightUrl =
        this.normalizeNullableString(next.cursorLightUrl) ?? null;
    }
    if (typeof next.cursorDarkUrl !== 'undefined') {
      next.cursorDarkUrl =
        this.normalizeNullableString(next.cursorDarkUrl) ?? null;
    }
    if (typeof next.faviconUrl !== 'undefined') {
      next.faviconUrl = this.normalizeNullableString(next.faviconUrl) ?? null;
    }
    if (typeof next.googleFont !== 'undefined') {
      next.googleFont = this.normalizeNullableString(next.googleFont) ?? null;
    }

    const normalizeLangStringMap = (
      incoming: Record<string, string | null> | null | undefined,
    ): Record<string, string> | null => {
      if (typeof incoming === 'undefined') {
        return null;
      }
      if (incoming === null) {
        return null;
      }

      const supported = Array.isArray(options?.supportedLangs)
        ? new Set(options?.supportedLangs)
        : null;

      const out: Record<string, string> = {};
      for (const [rawKey, rawValue] of Object.entries(incoming)) {
        const key = (rawKey ?? '').trim().toLowerCase();
        if (!key) continue;
        if (supported && !supported.has(key)) continue;

        const v = this.normalizeNullableString(rawValue);
        if (typeof v === 'string') {
          out[key] = v;
        }
      }

      return Object.keys(out).length > 0 ? out : null;
    };

    if (typeof next.googleFontByLang !== 'undefined') {
      next.googleFontByLang = normalizeLangStringMap(next.googleFontByLang);
    }
    if (typeof next.notFoundTitleByLang !== 'undefined') {
      next.notFoundTitleByLang = normalizeLangStringMap(
        next.notFoundTitleByLang,
      );
    }
    if (typeof next.notFoundMarkdownByLang !== 'undefined') {
      next.notFoundMarkdownByLang = normalizeLangStringMap(
        next.notFoundMarkdownByLang,
      );
    }
    if (typeof next.fontUrl !== 'undefined') {
      next.fontUrl = this.normalizeNullableString(next.fontUrl) ?? null;
    }
    if (typeof next.fontUrlByLang !== 'undefined') {
      next.fontUrlByLang = normalizeLangStringMap(next.fontUrlByLang);
    }
    if (typeof next.fontLicenseUrl !== 'undefined') {
      next.fontLicenseUrl =
        this.normalizeNullableString(next.fontLicenseUrl) ?? null;
    }
    if (typeof next.fontLicenseUrlByLang !== 'undefined') {
      next.fontLicenseUrlByLang = normalizeLangStringMap(
        next.fontLicenseUrlByLang,
      );
    }
    if (typeof next.customThemePresets !== 'undefined') {
      if (next.customThemePresets === null) {
        next.customThemePresets = null;
      } else if (Array.isArray(next.customThemePresets)) {
        type CustomThemePreset = NonNullable<
          NonNullable<InstanceBranding['customThemePresets']>[number]
        >;

        const asRecord = (value: unknown): Record<string, unknown> | null => {
          if (!value || typeof value !== 'object') {
            return null;
          }
          return value as Record<string, unknown>;
        };

        const asString = (value: unknown): string | null => {
          return typeof value === 'string' ? value : null;
        };

        const normalizeColor = (value: string | null | undefined) => {
          const trimmed = (value ?? '').trim();
          return trimmed.length > 0 ? trimmed : null;
        };

        const normalizePresetPalette = (
          palette: Record<string, unknown> | null,
        ) => {
          const obj = palette ?? {};
          const out = {
            background: normalizeColor(asString(obj.background) ?? undefined),
            foreground: normalizeColor(asString(obj.foreground) ?? undefined),
            primary: normalizeColor(asString(obj.primary) ?? undefined),
            secondary: normalizeColor(asString(obj.secondary) ?? undefined),
            error: normalizeColor(asString(obj.error) ?? undefined),
            card: normalizeColor(asString(obj.card) ?? undefined),
            border: normalizeColor(asString(obj.border) ?? undefined),
            scrollThumb: normalizeColor(asString(obj.scrollThumb) ?? undefined),
            scrollTrack: normalizeColor(asString(obj.scrollTrack) ?? undefined),
            fieldOkBg: normalizeColor(asString(obj.fieldOkBg) ?? undefined),
            fieldOkBorder: normalizeColor(
              asString(obj.fieldOkBorder) ?? undefined,
            ),
            fieldErrorBg: normalizeColor(
              asString(obj.fieldErrorBg) ?? undefined,
            ),
            fieldErrorBorder: normalizeColor(
              asString(obj.fieldErrorBorder) ?? undefined,
            ),
          };

          const hasAny = Object.values(out).some((v) => typeof v === 'string');
          return hasAny ? out : null;
        };

        const normalized = next.customThemePresets
          .map((raw) => {
            const obj = asRecord(raw);
            if (!obj) return null;

            const id = this.normalizeNullableString(asString(obj.id)) ?? null;
            const name =
              this.normalizeNullableString(asString(obj.name)) ?? null;
            const description =
              this.normalizeNullableString(asString(obj.description)) ?? null;

            if (!id || !name) return null;

            const light = normalizePresetPalette(asRecord(obj.light));
            const dark = normalizePresetPalette(asRecord(obj.dark));
            if (!light || !dark) return null;

            const createdAt =
              this.normalizeNullableString(asString(obj.createdAt)) ?? null;
            const updatedAt =
              this.normalizeNullableString(asString(obj.updatedAt)) ?? null;
            const createdBy =
              this.normalizeNullableString(asString(obj.createdBy)) ?? null;
            const updatedBy =
              this.normalizeNullableString(asString(obj.updatedBy)) ?? null;

            const preset: CustomThemePreset = {
              id,
              name,
              ...(description ? { description } : {}),
              light,
              dark,
              ...(createdAt ? { createdAt } : {}),
              ...(updatedAt ? { updatedAt } : {}),
              ...(createdBy ? { createdBy } : {}),
              ...(updatedBy ? { updatedBy } : {}),
            };

            return preset;
          })
          .filter((preset): preset is CustomThemePreset => Boolean(preset))
          .slice(0, 50);

        next.customThemePresets = normalized.length > 0 ? normalized : null;
      } else {
        next.customThemePresets = null;
      }
    }
    if (typeof next.theme !== 'undefined') {
      if (next.theme === null) {
        next.theme = null;
      } else {
        const modeRaw = this.normalizeNullableString(next.theme?.mode) ?? null;
        const mode =
          modeRaw === 'light' || modeRaw === 'dark' || modeRaw === 'system'
            ? modeRaw
            : null;

        const normalizeColor = (value: string | null | undefined) => {
          const trimmed = (value ?? '').trim();
          return trimmed.length > 0 ? trimmed : null;
        };

        const normalizePalette = (
          palette:
            | NonNullable<NonNullable<InstanceBranding['theme']>['light']>
            | null
            | undefined,
        ) => {
          if (palette === null) return null;
          const obj = palette ?? {};
          const out = {
            background: normalizeColor(obj.background),
            foreground: normalizeColor(obj.foreground),
            primary: normalizeColor(obj.primary),
            secondary: normalizeColor(obj.secondary),
            error: normalizeColor(obj.error),
            card: normalizeColor(obj.card),
            border: normalizeColor(obj.border),
            scrollThumb: normalizeColor(obj.scrollThumb),
            scrollTrack: normalizeColor(obj.scrollTrack),
            fieldOkBg: normalizeColor(obj.fieldOkBg),
            fieldOkBorder: normalizeColor(obj.fieldOkBorder),
            fieldErrorBg: normalizeColor(obj.fieldErrorBg),
            fieldErrorBorder: normalizeColor(obj.fieldErrorBorder),
          };

          const hasAny = Object.values(out).some((v) => typeof v === 'string');
          return hasAny ? out : null;
        };

        const light = normalizePalette(next.theme?.light);
        const dark = normalizePalette(next.theme?.dark);
        next.theme =
          mode || light || dark
            ? {
                ...(mode ? { mode } : {}),
                ...(light ? { light } : {}),
                ...(dark ? { dark } : {}),
              }
            : null;
      }
    }
    if (typeof next.logoUrl !== 'undefined') {
      next.logoUrl = this.normalizeNullableString(next.logoUrl) ?? null;
    }
    if (typeof next.logoLightUrl !== 'undefined') {
      next.logoLightUrl =
        this.normalizeNullableString(next.logoLightUrl) ?? null;
    }
    if (typeof next.logoDarkUrl !== 'undefined') {
      next.logoDarkUrl = this.normalizeNullableString(next.logoDarkUrl) ?? null;
    }
    if (typeof next.primaryColor !== 'undefined') {
      next.primaryColor =
        this.normalizeNullableString(next.primaryColor) ?? null;
    }

    if (typeof next.socialDescription !== 'undefined') {
      next.socialDescription =
        this.normalizeNullableString(next.socialDescription) ?? null;
    }

    if (typeof next.cursorHotspot !== 'undefined') {
      if (next.cursorHotspot === null) {
        next.cursorHotspot = null;
      } else {
        const x =
          typeof next.cursorHotspot?.x === 'number'
            ? next.cursorHotspot.x
            : null;
        const y =
          typeof next.cursorHotspot?.y === 'number'
            ? next.cursorHotspot.y
            : null;
        next.cursorHotspot =
          typeof x === 'number' || typeof y === 'number'
            ? {
                ...(typeof x === 'number' ? { x } : {}),
                ...(typeof y === 'number' ? { y } : {}),
              }
            : null;
      }
    }

    if (typeof next.socialImage !== 'undefined') {
      if (next.socialImage === null) {
        next.socialImage = null;
      } else {
        const imageUrl =
          this.normalizeNullableString(next.socialImage?.imageUrl) ?? null;
        next.socialImage = imageUrl ? { imageUrl } : null;
      }
    }

    if (typeof next.openGraph !== 'undefined') {
      if (next.openGraph === null) {
        next.openGraph = null;
      } else {
        const title =
          this.normalizeNullableString(next.openGraph?.title) ?? null;
        const description =
          this.normalizeNullableString(next.openGraph?.description) ?? null;
        const imageUrl =
          this.normalizeNullableString(next.openGraph?.imageUrl) ?? null;

        if (!title && !description && !imageUrl) {
          next.openGraph = null;
        } else {
          const openGraph: NonNullable<InstanceBranding['openGraph']> = {
            ...(title ? { title } : {}),
            ...(description ? { description } : {}),
            ...(imageUrl ? { imageUrl } : {}),
          };
          next.openGraph = openGraph;
        }
      }
    }

    if (typeof next.twitter !== 'undefined') {
      if (next.twitter === null) {
        next.twitter = null;
      } else {
        const title = this.normalizeNullableString(next.twitter?.title) ?? null;
        const description =
          this.normalizeNullableString(next.twitter?.description) ?? null;
        const imageUrl =
          this.normalizeNullableString(next.twitter?.imageUrl) ?? null;
        const card =
          this.normalizeNullableString(next.twitter?.card, { lower: true }) ??
          null;

        const twitter = next.twitter;

        let app: Twitter['app'] = null;
        const incomingApp = twitter.app;
        if (incomingApp && typeof incomingApp === 'object') {
          const name = this.normalizeNullableString(incomingApp.name) ?? null;
          const idIphone =
            this.normalizeNullableString(incomingApp.id?.iphone) ?? null;
          const idIpad =
            this.normalizeNullableString(incomingApp.id?.ipad) ?? null;
          const idGoogleplay =
            this.normalizeNullableString(incomingApp.id?.googleplay) ?? null;
          const urlIphone =
            this.normalizeNullableString(incomingApp.url?.iphone) ?? null;
          const urlIpad =
            this.normalizeNullableString(incomingApp.url?.ipad) ?? null;
          const urlGoogleplay =
            this.normalizeNullableString(incomingApp.url?.googleplay) ?? null;

          const id: NonNullable<TwitterApp['id']> | null =
            idIphone || idIpad || idGoogleplay
              ? {
                  ...(idIphone ? { iphone: idIphone } : {}),
                  ...(idIpad ? { ipad: idIpad } : {}),
                  ...(idGoogleplay ? { googleplay: idGoogleplay } : {}),
                }
              : null;

          const url: NonNullable<TwitterApp['url']> | null =
            urlIphone || urlIpad || urlGoogleplay
              ? {
                  ...(urlIphone ? { iphone: urlIphone } : {}),
                  ...(urlIpad ? { ipad: urlIpad } : {}),
                  ...(urlGoogleplay ? { googleplay: urlGoogleplay } : {}),
                }
              : null;

          const appObj: TwitterApp = {
            ...(name ? { name } : {}),
            ...(id ? { id } : {}),
            ...(url ? { url } : {}),
          };

          app = name || id || url ? appObj : null;
        }

        let player: Twitter['player'] = null;
        const incomingPlayer = twitter.player;
        if (incomingPlayer && typeof incomingPlayer === 'object') {
          const url = this.normalizeNullableString(incomingPlayer.url) ?? null;
          const stream =
            this.normalizeNullableString(incomingPlayer.stream) ?? null;
          const streamContentType =
            this.normalizeNullableString(incomingPlayer.streamContentType) ??
            null;

          const width =
            typeof incomingPlayer.width === 'number'
              ? incomingPlayer.width
              : null;
          const height =
            typeof incomingPlayer.height === 'number'
              ? incomingPlayer.height
              : null;

          const hasAnyPlayer =
            Boolean(url) ||
            Boolean(stream) ||
            Boolean(streamContentType) ||
            typeof width === 'number' ||
            typeof height === 'number';

          if (hasAnyPlayer) {
            const playerObj: TwitterPlayer = {
              ...(url ? { url } : {}),
              ...(typeof width === 'number' ? { width } : {}),
              ...(typeof height === 'number' ? { height } : {}),
              ...(stream ? { stream } : {}),
              ...(streamContentType ? { streamContentType } : {}),
            };

            player = playerObj;
          } else {
            player = null;
          }
        }

        if (!title && !description && !imageUrl && !card && !app && !player) {
          next.twitter = null;
        } else {
          const twitterObj: NonNullable<InstanceBranding['twitter']> = {
            ...(title ? { title } : {}),
            ...(description ? { description } : {}),
            ...(imageUrl ? { imageUrl } : {}),
            ...(card ? { card } : {}),
            ...(app ? { app } : {}),
            ...(player ? { player } : {}),
          };
          next.twitter = twitterObj;
        }
      }
    }

    return next;
  }

  private mergeSocialCredentials(
    current: InstanceSocialCredentials | null,
    update: AdminUpdateSocialCredentialsDto,
    updatedBy: string | null,
  ): InstanceSocialCredentials | null {
    const next: InstanceSocialCredentials = { ...(current ?? {}) };

    const mergeProvider = (
      provider: SocialProviderName,
      incoming?: AdminUpdateSocialCredentialsDto[SocialProviderName],
    ) => {
      if (!incoming) return;
      const existing = next[provider] ?? {};
      const result: SocialProviderCredentials = { ...existing };
      let didChange = false;

      const normalize = (
        value: string | null | undefined,
      ): string | null | undefined => {
        if (typeof value === 'undefined') {
          return undefined;
        }
        if (value === null) {
          return null;
        }
        const trimmed = value.trim();
        return trimmed.length > 0 ? trimmed : null;
      };

      const setField = (
        field: 'clientId' | 'clientSecret' | 'redirectUri' | 'notes',
        value: string | null | undefined,
      ) => {
        if (typeof value === 'undefined') {
          return;
        }
        const currentValue =
          typeof result[field] === 'undefined' ? null : (result[field] ?? null);
        if (currentValue !== value) {
          result[field] = value;
          didChange = true;
        }
      };

      setField('clientId', normalize(incoming.clientId));
      setField('clientSecret', normalize(incoming.clientSecret));
      setField('redirectUri', normalize(incoming.redirectUri));
      setField('notes', normalize(incoming.notes));

      const hasAnyCredential =
        Boolean(result.clientId) ||
        Boolean(result.clientSecret) ||
        Boolean(result.redirectUri) ||
        Boolean(result.notes);

      if (!hasAnyCredential) {
        delete next[provider];
        return;
      } else {
        if (didChange) {
          result.updatedBy = updatedBy ?? null;
          result.updatedAt = new Date().toISOString();
        }
        next[provider] = result;
      }
    };

    mergeProvider('google', update.google);
    mergeProvider('facebook', update.facebook);
    mergeProvider('github', update.github);
    mergeProvider('linkedin', update.linkedin);

    return Object.keys(next).length > 0 ? next : null;
  }

  private buildEnvSocialCredentialEntries():
    | Partial<Record<SocialProviderName, SocialProviderCredentials>>
    | undefined {
    const entries: Partial<
      Record<SocialProviderName, SocialProviderCredentials>
    > = {};

    for (const provider of Object.keys(
      SOCIAL_PROVIDER_ENV_MAP,
    ) as SocialProviderName[]) {
      const envCreds = this.getEnvSocialProviderCredentials(provider);
      if (envCreds) {
        entries[provider] = envCreds;
      }
    }

    return Object.keys(entries).length > 0 ? entries : undefined;
  }

  private getEnvSocialProviderCredentials(
    provider: SocialProviderName,
  ): SocialProviderCredentials | null {
    const envKeys = SOCIAL_PROVIDER_ENV_MAP[provider];
    if (!envKeys) {
      return null;
    }
    const clientId = process.env[envKeys.clientId] ?? null;
    const clientSecret = process.env[envKeys.clientSecret] ?? null;
    const redirectUri = process.env[envKeys.redirectUri] ?? null;
    if (!clientId && !clientSecret && !redirectUri) {
      return null;
    }
    return {
      clientId,
      clientSecret,
      redirectUri,
    };
  }

  async getEffectiveSocialProviderCredentials(
    provider: SocialProviderName,
  ): Promise<SocialProviderCredentials | null> {
    const stored = await this.getSocialProviderCredentials(provider);
    if (
      stored &&
      (stored.clientId || stored.clientSecret || stored.redirectUri)
    ) {
      return stored;
    }
    return this.getEnvSocialProviderCredentials(provider);
  }

  async getSocialCredentials(): Promise<InstanceSocialCredentials | null> {
    const cfg = await this.getOrCreateInstanceConfig();
    return cfg.socialCredentials ?? null;
  }

  async getSocialProviderCredentials(
    provider: SocialProviderName,
  ): Promise<SocialProviderCredentials | null> {
    const credentials = await this.getSocialCredentials();
    const entry = credentials?.[provider];
    if (!entry) {
      return null;
    }

    return {
      clientId: entry.clientId ?? null,
      clientSecret: entry.clientSecret ?? null,
      redirectUri: entry.redirectUri ?? null,
      notes: entry.notes ?? null,
    };
  }

  async getSanitizedSocialCredentials(): Promise<
    Partial<
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
    >
  > {
    const credentials = await this.getSocialCredentials();
    if (!credentials) {
      return {};
    }

    const sanitized: Partial<
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
    > = {};

    for (const provider of Object.keys(credentials) as SocialProviderName[]) {
      const entry = credentials[provider];
      if (!entry) continue;
      sanitized[provider] = {
        clientId: entry.clientId ?? null,
        redirectUri: entry.redirectUri ?? null,
        hasClientSecret: Boolean(entry.clientSecret),
        notes: entry.notes ?? null,
        updatedBy: entry.updatedBy ?? null,
        updatedAt: entry.updatedAt ?? null,
      };
    }

    return sanitized;
  }
}
