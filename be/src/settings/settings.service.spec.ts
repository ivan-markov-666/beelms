import type { Repository } from 'typeorm';
import { BadRequestException } from '@nestjs/common';
import { SettingsService } from './settings.service';
import type {
  InstanceBranding,
  InstanceConfig,
  InstanceFeatures,
  InstanceLanguages,
  InstanceSeo,
  InstanceSocialCredentials,
} from './instance-config.entity';
import type { AdminUpdateInstanceSettingsDto } from './dto/admin-update-instance-settings.dto';

describe('SettingsService – social credentials', () => {
  let repo: {
    find: jest.Mock;
    save: jest.Mock;
    create: jest.Mock;
  };
  let service: SettingsService;

  const defaultBranding: InstanceBranding = {
    appName: 'BeeLMS',
    browserTitle: 'BeeLMS',
    loginSocialUnavailableMessageEnabled: true,
    loginSocialResetPasswordHintEnabled: true,
    registerSocialUnavailableMessageEnabled: true,
    pageLinks: {
      enabled: true,
      bySlug: {
        terms: { footer: true },
        privacy: { footer: true },
        'cookie-policy': { footer: true },
        imprint: { footer: true },
        accessibility: { footer: true },
        contact: { footer: true },
        faq: { footer: true },
        support: { footer: true },
      },
    },
    poweredByBeeLms: {
      enabled: false,
      url: null,
    },
    cursorUrl: null,
    cursorLightUrl: null,
    cursorDarkUrl: null,
    cursorPointerUrl: null,
    cursorPointerLightUrl: null,
    cursorPointerDarkUrl: null,
    cursorHotspot: null,
    faviconUrl: null,
    googleFont: null,
    googleFontByLang: null,
    fontUrl: null,
    fontUrlByLang: null,
    footerSocialLinks: null,
    logoUrl: null,
    logoLightUrl: null,
    logoDarkUrl: null,
    primaryColor: null,
    socialImage: null,
    socialDescription: null,
    openGraph: null,
    twitter: null,
  };

  const defaultFeatures: InstanceFeatures = {
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
    auth2fa: false,
    captcha: false,
    captchaLogin: false,
    captchaRegister: false,
    captchaForgotPassword: false,
    captchaChangePassword: false,
    paidCourses: true,
    paymentsStripe: true,
    paymentsPaypal: true,
    paymentsMypos: false,
    paymentsRevolut: false,
    gdprLegal: true,
    pageTerms: true,
    pagePrivacy: true,
    pageCookiePolicy: true,
    pageImprint: true,
    pageAccessibility: true,
    pageContact: true,
    pageFaq: true,
    pageSupport: true,
    pageNotFound: true,
    socialGoogle: true,
    socialFacebook: true,
    socialGithub: true,
    socialLinkedin: true,
    infraRedis: false,
    infraRedisUrl: null,
    infraRabbitmq: false,
    infraRabbitmqUrl: null,
    infraMonitoring: true,
    infraMonitoringUrl: 'https://example.com/monitoring',
    infraErrorTracking: false,
    infraErrorTrackingUrl: null,
  };

  const defaultLanguages: InstanceLanguages = {
    supported: ['bg'],
    default: 'bg',
    icons: null,
    flagPicker: null,
  };

  const buildConfig = (
    overrides: Partial<InstanceConfig> = {},
  ): InstanceConfig => ({
    id: 'cfg-id',
    branding: defaultBranding,
    features: defaultFeatures,
    languages: defaultLanguages,
    seo: {
      baseUrl: null,
      titleTemplate: '{page} | {site}',
      defaultTitle: null,
      defaultDescription: null,
      robots: { index: true },
      sitemap: {
        enabled: true,
        includeWiki: true,
        includeCourses: true,
        includeLegal: true,
      },
    },
    socialCredentials: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  beforeEach(() => {
    repo = {
      find: jest.fn(),
      save: jest.fn(async (value) => value),
      create: jest.fn((value) => value),
    };

    service = new SettingsService(
      repo as unknown as Repository<InstanceConfig>,
    );
  });

  afterEach(() => {
    jest.resetAllMocks();
    delete process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_SECRET;
    delete process.env.GOOGLE_OAUTH_REDIRECT_URL;
  });

  it('prefers stored credentials over environment fallbacks', async () => {
    const stored: InstanceSocialCredentials = {
      google: {
        clientId: 'db-client',
        clientSecret: 'db-secret',
        redirectUri: 'https://db.example/callback',
      },
    };
    repo.find.mockResolvedValue([buildConfig({ socialCredentials: stored })]);

    process.env.GOOGLE_CLIENT_ID = 'env-client';
    process.env.GOOGLE_CLIENT_SECRET = 'env-secret';
    process.env.GOOGLE_OAUTH_REDIRECT_URL = 'https://env/callback';

    const creds = await service.getEffectiveSocialProviderCredentials('google');
    expect(creds).toEqual({ ...stored.google, notes: null });
  });

  it('falls back to environment variables when DB has no entry', async () => {
    repo.find.mockResolvedValue([buildConfig({ socialCredentials: null })]);
    process.env.GOOGLE_CLIENT_ID = 'env-client';
    process.env.GOOGLE_CLIENT_SECRET = 'env-secret';
    process.env.GOOGLE_OAUTH_REDIRECT_URL = 'https://env/callback';

    const creds = await service.getEffectiveSocialProviderCredentials('google');
    expect(creds).toEqual({
      clientId: 'env-client',
      clientSecret: 'env-secret',
      redirectUri: 'https://env/callback',
    });
  });

  it('sanitizes credentials by masking secrets', async () => {
    const stored: InstanceSocialCredentials = {
      google: {
        clientId: 'db-client',
        clientSecret: 'db-secret',
        redirectUri: 'https://db.example/callback',
      },
    };
    repo.find.mockResolvedValue([buildConfig({ socialCredentials: stored })]);

    const sanitized = await service.getSanitizedSocialCredentials();

    expect(sanitized.google).toEqual({
      clientId: 'db-client',
      redirectUri: 'https://db.example/callback',
      hasClientSecret: true,
      notes: null,
      updatedBy: null,
      updatedAt: null,
    });
  });

  it('merges social credentials updates and allows clearing secrets', async () => {
    const stored: InstanceSocialCredentials = {
      google: {
        clientId: 'db-client',
        clientSecret: 'db-secret',
        redirectUri: 'https://db.example/callback',
      },
    };
    const existing = buildConfig({ socialCredentials: stored });
    repo.find.mockResolvedValue([existing]);

    await service.updateInstanceConfig({
      socialCredentials: {
        google: {
          clientId: 'db-client',
          redirectUri: 'https://db.example/callback',
          clientSecret: null,
        },
      },
    } as AdminUpdateInstanceSettingsDto);

    expect(repo.save).toHaveBeenCalled();
    const saveMock = repo.save as jest.MockedFunction<
      (config: InstanceConfig) => Promise<InstanceConfig>
    >;
    const savedConfig = saveMock.mock.calls.at(-1)?.[0];
    if (!savedConfig) {
      throw new Error('Expected repo.save to be called');
    }
    expect(savedConfig.socialCredentials?.google).toMatchObject({
      clientId: 'db-client',
      clientSecret: null,
      redirectUri: 'https://db.example/callback',
      updatedBy: null,
    });
    expect(savedConfig.socialCredentials?.google?.updatedAt).toEqual(
      expect.any(String),
    );
  });
});

describe('SettingsService – infra toggles validation', () => {
  let repo: {
    find: jest.Mock;
    save: jest.Mock;
    create: jest.Mock;
  };
  let service: SettingsService;

  const defaults = (svc: SettingsService) =>
    svc as unknown as {
      buildDefaultBranding: () => InstanceBranding;
      buildDefaultFeatures: () => InstanceFeatures;
      buildDefaultSeo: () => InstanceSeo;
    };

  const buildConfig = (
    overrides: Partial<InstanceConfig> = {},
  ): InstanceConfig => {
    const d = defaults(service);
    const baseSeo = d.buildDefaultSeo();
    const seo = overrides.seo ?? baseSeo;
    const restOverrides: Partial<InstanceConfig> = { ...overrides };
    delete (restOverrides as Partial<Record<string, unknown>>).seo;
    return {
      id: 'cfg-id',
      branding: d.buildDefaultBranding(),
      features: d.buildDefaultFeatures(),
      languages: {
        supported: ['bg'],
        default: 'bg',
        icons: null,
        flagPicker: null,
      },
      seo,
      socialCredentials: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...restOverrides,
    };
  };

  beforeEach(() => {
    repo = {
      find: jest.fn(),
      save: jest.fn(async (value) => value),
      create: jest.fn((value) => value),
    };
    service = new SettingsService(
      repo as unknown as Repository<InstanceConfig>,
    );
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('rejects infraMonitoring=true when infraMonitoringUrl is missing/invalid', async () => {
    repo.find.mockResolvedValue([buildConfig()]);

    await expect(
      service.updateInstanceConfig({
        features: {
          infraMonitoring: true,
          infraMonitoringUrl: 'ftp://example.com',
        },
      } as AdminUpdateInstanceSettingsDto),
    ).rejects.toThrow(BadRequestException);
  });

  it('allows infraMonitoring=false with empty url (normalizes to null)', async () => {
    repo.find.mockResolvedValue([buildConfig()]);

    await service.updateInstanceConfig({
      features: {
        infraMonitoring: false,
        infraMonitoringUrl: '   ',
      },
    } as AdminUpdateInstanceSettingsDto);

    expect(repo.save).toHaveBeenCalled();
    const saveMock = repo.save as jest.MockedFunction<
      (config: InstanceConfig) => Promise<InstanceConfig>
    >;
    const savedConfig = saveMock.mock.calls.at(-1)?.[0];
    if (!savedConfig) throw new Error('Expected repo.save to be called');
    expect(savedConfig.features.infraMonitoring).toBe(false);
    expect(savedConfig.features.infraMonitoringUrl).toBeNull();
  });

  it('rejects infraErrorTracking=true when infraErrorTrackingUrl is missing/invalid', async () => {
    repo.find.mockResolvedValue([buildConfig()]);

    await expect(
      service.updateInstanceConfig({
        features: {
          infraErrorTracking: true,
          infraErrorTrackingUrl: 'not-a-url',
        },
      } as AdminUpdateInstanceSettingsDto),
    ).rejects.toThrow(BadRequestException);
  });

  it('accepts infraRedis=true for redis://... and host:port and rejects invalid values', async () => {
    repo.find.mockResolvedValue([buildConfig()]);

    await service.updateInstanceConfig({
      features: {
        infraMonitoring: false,
        infraRedis: true,
        infraRedisUrl: ' redis://localhost:6379 ',
      },
    } as AdminUpdateInstanceSettingsDto);

    const saveMock = repo.save as jest.MockedFunction<
      (config: InstanceConfig) => Promise<InstanceConfig>
    >;
    let savedConfig = saveMock.mock.calls.at(-1)?.[0];
    if (!savedConfig) throw new Error('Expected repo.save to be called');
    expect(savedConfig.features.infraRedis).toBe(true);
    expect(savedConfig.features.infraRedisUrl).toBe('redis://localhost:6379');

    repo.find.mockResolvedValue([buildConfig()]);
    await service.updateInstanceConfig({
      features: {
        infraMonitoring: false,
        infraRedis: true,
        infraRedisUrl: 'localhost:6379',
      },
    } as AdminUpdateInstanceSettingsDto);

    savedConfig = saveMock.mock.calls.at(-1)?.[0];
    if (!savedConfig) throw new Error('Expected repo.save to be called');
    expect(savedConfig.features.infraRedisUrl).toBe('localhost:6379');

    repo.find.mockResolvedValue([buildConfig()]);
    await expect(
      service.updateInstanceConfig({
        features: {
          infraMonitoring: false,
          infraRedis: true,
          infraRedisUrl: 'http://localhost:6379',
        },
      } as AdminUpdateInstanceSettingsDto),
    ).rejects.toThrow(BadRequestException);
  });

  it('accepts infraRabbitmq=true for amqp(s) URLs and rejects invalid values', async () => {
    repo.find.mockResolvedValue([buildConfig()]);

    await service.updateInstanceConfig({
      features: {
        infraMonitoring: false,
        infraRabbitmq: true,
        infraRabbitmqUrl: 'amqp://guest:guest@localhost:5672',
      },
    } as AdminUpdateInstanceSettingsDto);

    const saveMock = repo.save as jest.MockedFunction<
      (config: InstanceConfig) => Promise<InstanceConfig>
    >;
    const savedConfig = saveMock.mock.calls.at(-1)?.[0];
    if (!savedConfig) throw new Error('Expected repo.save to be called');
    expect(savedConfig.features.infraRabbitmq).toBe(true);
    expect(savedConfig.features.infraRabbitmqUrl).toBe(
      'amqp://guest:guest@localhost:5672',
    );

    repo.find.mockResolvedValue([buildConfig()]);
    await expect(
      service.updateInstanceConfig({
        features: {
          infraMonitoring: false,
          infraRabbitmq: true,
          infraRabbitmqUrl: 'https://example.com',
        },
      } as AdminUpdateInstanceSettingsDto),
    ).rejects.toThrow(BadRequestException);
  });
});

describe('SettingsService – 404 i18n overrides', () => {
  let repo: {
    find: jest.Mock;
    save: jest.Mock;
    create: jest.Mock;
  };
  let service: SettingsService;

  beforeEach(() => {
    repo = {
      find: jest.fn(),
      save: jest.fn(async (value) => value),
      create: jest.fn((value) => value),
    };

    service = new SettingsService(
      repo as unknown as Repository<InstanceConfig>,
    );
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('filters notFound*ByLang to supported languages and normalizes keys', async () => {
    const defaults = service as unknown as {
      buildDefaultBranding: () => InstanceBranding;
      buildDefaultFeatures: () => InstanceFeatures;
      buildDefaultSeo: () => InstanceSeo;
    };
    const baseBranding = defaults.buildDefaultBranding();
    const baseFeatures = defaults.buildDefaultFeatures();
    const baseSeo = defaults.buildDefaultSeo();
    repo.find.mockResolvedValue([
      {
        id: 'cfg-id',
        branding: baseBranding,
        features: { ...baseFeatures, infraMonitoring: false },
        languages: {
          supported: ['bg', 'en'],
          default: 'bg',
          icons: null,
          flagPicker: null,
        },
        seo: baseSeo,
        socialCredentials: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    const dto = {
      branding: {
        notFoundTitleByLang: {
          EN: 'English title',
          de: 'German title',
          '  bg  ': 'Bulgarian title',
        },
        notFoundMarkdownByLang: {
          en: 'EN md',
          de: 'DE md',
        },
      },
    } as unknown as AdminUpdateInstanceSettingsDto;

    const updated = await service.updateInstanceConfig(dto);

    expect(updated.branding.notFoundTitleByLang).toEqual({
      en: 'English title',
      bg: 'Bulgarian title',
    });
    expect(updated.branding.notFoundMarkdownByLang).toEqual({ en: 'EN md' });
  });

  it('turns empty notFound*ByLang maps into null after filtering', async () => {
    const defaults = service as unknown as {
      buildDefaultBranding: () => InstanceBranding;
      buildDefaultFeatures: () => InstanceFeatures;
      buildDefaultSeo: () => InstanceSeo;
    };
    const baseBranding = defaults.buildDefaultBranding();
    const baseFeatures = defaults.buildDefaultFeatures();
    const baseSeo = defaults.buildDefaultSeo();
    repo.find.mockResolvedValue([
      {
        id: 'cfg-id',
        branding: baseBranding,
        features: { ...baseFeatures, infraMonitoring: false },
        languages: {
          supported: ['bg'],
          default: 'bg',
          icons: null,
          flagPicker: null,
        },
        seo: baseSeo,
        socialCredentials: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    const dto = {
      branding: {
        notFoundTitleByLang: {
          en: 'English title',
        },
        notFoundMarkdownByLang: {
          en: 'EN md',
        },
      },
    } as unknown as AdminUpdateInstanceSettingsDto;

    const updated = await service.updateInstanceConfig(dto);

    expect(updated.branding.notFoundTitleByLang).toBeNull();
    expect(updated.branding.notFoundMarkdownByLang).toBeNull();
  });
});

describe('SettingsService – branding normalization', () => {
  let repo: {
    find: jest.Mock;
    save: jest.Mock;
    create: jest.Mock;
  };
  let service: SettingsService;

  const defaultBranding: InstanceBranding = {
    appName: 'BeeLMS',
    browserTitle: 'BeeLMS',
    loginSocialUnavailableMessageEnabled: true,
    loginSocialResetPasswordHintEnabled: true,
    registerSocialUnavailableMessageEnabled: true,
    pageLinks: {
      enabled: true,
      bySlug: {
        terms: { footer: true },
        privacy: { footer: true },
        'cookie-policy': { footer: true },
        imprint: { footer: true },
        accessibility: { footer: true },
        contact: { footer: true },
        faq: { footer: true },
        support: { footer: true },
      },
    },
    poweredByBeeLms: {
      enabled: false,
      url: null,
    },
    cursorUrl: null,
    cursorPointerUrl: null,
    cursorPointerLightUrl: null,
    cursorPointerDarkUrl: null,
    cursorHotspot: null,
    faviconUrl: null,
    googleFont: null,
    googleFontByLang: null,
    fontUrl: null,
    fontUrlByLang: null,
    footerSocialLinks: null,
    logoUrl: null,
    primaryColor: null,
    socialImage: null,
    socialDescription: null,
    openGraph: null,
    twitter: null,
  };

  const defaultFeatures: InstanceFeatures = {
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
    auth2fa: false,
    captcha: false,
    captchaLogin: false,
    captchaRegister: false,
    captchaForgotPassword: false,
    captchaChangePassword: false,
    paidCourses: true,
    paymentsStripe: true,
    paymentsPaypal: true,
    paymentsMypos: false,
    paymentsRevolut: false,
    gdprLegal: true,
    pageTerms: true,
    pagePrivacy: true,
    pageCookiePolicy: true,
    pageImprint: true,
    pageAccessibility: true,
    pageContact: true,
    pageFaq: true,
    pageSupport: true,
    pageNotFound: true,
    socialGoogle: true,
    socialFacebook: true,
    socialGithub: true,
    socialLinkedin: true,
    infraRedis: false,
    infraRedisUrl: null,
    infraRabbitmq: false,
    infraRabbitmqUrl: null,
    infraMonitoring: true,
    infraMonitoringUrl: 'https://example.com/monitoring',
    infraErrorTracking: false,
    infraErrorTrackingUrl: null,
  };

  const defaultLanguages: InstanceLanguages = {
    supported: ['bg'],
    default: 'bg',
    icons: null,
    flagPicker: null,
  };

  const buildConfig = (
    overrides: Partial<InstanceConfig> = {},
  ): InstanceConfig => {
    const base: InstanceConfig = {
      id: 'cfg-id',
      branding: defaultBranding,
      features: defaultFeatures,
      languages: defaultLanguages,
      seo: {
        baseUrl: null,
        titleTemplate: '{page} | {site}',
        defaultTitle: null,
        defaultDescription: null,
        robots: { index: true },
        sitemap: {
          enabled: true,
          includeWiki: true,
          includeCourses: true,
          includeLegal: true,
        },
      },
      socialCredentials: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const merged: InstanceConfig = {
      ...base,
      ...overrides,
      seo: overrides.seo ?? base.seo,
    };

    return merged;
  };

  beforeEach(() => {
    repo = {
      find: jest.fn(),
      save: jest.fn(async (value) => value),
      create: jest.fn((value) => value),
    };

    service = new SettingsService(
      repo as unknown as Repository<InstanceConfig>,
    );
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('does not clear existing branding fields when a partial branding update is applied', async () => {
    const existing = buildConfig({
      branding: {
        ...defaultBranding,
        cursorUrl: '/branding/media/existing-cursor.png',
        cursorLightUrl: '/branding/media/existing-cursor-light.png',
        cursorDarkUrl: '/branding/media/existing-cursor-dark.png',
        cursorHotspot: { x: 12, y: 14 },
        logoUrl: '/branding/media/existing-logo.png',
        logoLightUrl: '/branding/media/existing-logo-light.png',
        logoDarkUrl: '/branding/media/existing-logo-dark.png',
        fontUrl: '/branding/media/existing-font.woff2',
      },
    });

    repo.find.mockResolvedValue([existing]);

    await service.updateInstanceConfig({
      branding: {
        faviconUrl: '/branding/media/new-favicon.png',
      },
    } as AdminUpdateInstanceSettingsDto);

    const saveMock = repo.save as jest.MockedFunction<
      (config: InstanceConfig) => Promise<InstanceConfig>
    >;
    const savedConfig = saveMock.mock.calls[0][0];

    expect(savedConfig.branding.faviconUrl).toBe(
      '/branding/media/new-favicon.png',
    );
    expect(savedConfig.branding.cursorUrl).toBe(
      '/branding/media/existing-cursor.png',
    );
    expect(savedConfig.branding.cursorLightUrl).toBe(
      '/branding/media/existing-cursor-light.png',
    );
    expect(savedConfig.branding.cursorDarkUrl).toBe(
      '/branding/media/existing-cursor-dark.png',
    );
    expect(savedConfig.branding.cursorHotspot).toEqual({ x: 12, y: 14 });
    expect(savedConfig.branding.logoUrl).toBe(
      '/branding/media/existing-logo.png',
    );
    expect(savedConfig.branding.logoLightUrl).toBe(
      '/branding/media/existing-logo-light.png',
    );
    expect(savedConfig.branding.logoDarkUrl).toBe(
      '/branding/media/existing-logo-dark.png',
    );
    expect(savedConfig.branding.fontUrl).toBe(
      '/branding/media/existing-font.woff2',
    );
  });

  it('normalizes empty strings to null and prunes empty nested social metadata objects', async () => {
    repo.find.mockResolvedValue([buildConfig()]);

    await service.updateInstanceConfig({
      branding: {
        socialDescription: '   ',
        socialImage: {
          imageUrl: '  ',
        },
        openGraph: {
          title: ' ',
          description: '',
          imageUrl: '   ',
        },
        twitter: {
          title: '',
          description: '   ',
          imageUrl: ' ',
          card: ' PLAYER ',
          player: {
            url: ' ',
            width: null,
            height: null,
          },
          app: {
            name: ' ',
            id: {
              iphone: ' ',
            },
          },
        },
      },
    } as AdminUpdateInstanceSettingsDto);

    expect(repo.save).toHaveBeenCalled();
    const saveMock = repo.save as jest.MockedFunction<
      (config: InstanceConfig) => Promise<InstanceConfig>
    >;
    const savedConfig = saveMock.mock.calls.at(-1)?.[0];
    if (!savedConfig) {
      throw new Error('Expected repo.save to be called');
    }

    expect(savedConfig.branding.socialDescription).toBeNull();
    expect(savedConfig.branding.socialImage).toBeNull();
    expect(savedConfig.branding.openGraph).toBeNull();

    expect(savedConfig.branding.twitter).toEqual({
      card: 'player',
    });
  });

  it('deep-merges nested branding updates and preserves existing nested objects when partial updates are applied', async () => {
    const existing = buildConfig({
      branding: {
        ...defaultBranding,
        openGraph: {
          title: 'Existing OG title',
          description: null,
          imageUrl: null,
        },
        socialImage: {
          imageUrl: '/branding/media/existing-shared.png',
        },
        twitter: {
          title: 'Existing twitter title',
          description: null,
          imageUrl: null,
          card: 'app',
          app: {
            name: 'Existing App',
            id: { iphone: 'existing://iphone' },
            url: null,
          },
          player: null,
        },
      },
    });

    repo.find.mockResolvedValue([existing]);

    await service.updateInstanceConfig({
      branding: {
        openGraph: {
          description: ' New OG description ',
        },
        twitter: {
          description: ' New twitter description ',
        },
      },
    } as AdminUpdateInstanceSettingsDto);

    const saveMock = repo.save as jest.MockedFunction<
      (config: InstanceConfig) => Promise<InstanceConfig>
    >;
    const savedConfig = saveMock.mock.calls[0][0];

    expect(savedConfig.branding.socialImage).toEqual({
      imageUrl: '/branding/media/existing-shared.png',
    });

    expect(savedConfig.branding.openGraph).toEqual({
      title: 'Existing OG title',
      description: 'New OG description',
    });

    expect(savedConfig.branding.twitter).toMatchObject({
      title: 'Existing twitter title',
      description: 'New twitter description',
      card: 'app',
      app: {
        name: 'Existing App',
        id: { iphone: 'existing://iphone' },
      },
    });
  });
});
