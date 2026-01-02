import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  InstanceBranding,
  InstanceConfig,
  InstanceFeatures,
  InstanceLanguages,
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
      logoUrl: null,
      primaryColor: null,
    };
  }

  private buildDefaultFeatures(): InstanceFeatures {
    return {
      wikiPublic: true,
      courses: true,
      auth: true,
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
      return existing;
    }

    const created = this.instanceConfigRepo.create({
      branding: this.buildDefaultBranding(),
      features: this.buildDefaultFeatures(),
      languages: this.buildDefaultLanguages(),
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

    const branding = dto.branding
      ? {
          ...cfg.branding,
          ...dto.branding,
        }
      : cfg.branding;

    const features = dto.features
      ? {
          ...cfg.features,
          ...dto.features,
        }
      : cfg.features;

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

    cfg.branding = branding;
    cfg.features = features;
    cfg.languages = languages;
    cfg.socialCredentials = socialCredentials;

    return this.instanceConfigRepo.save(cfg);
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
