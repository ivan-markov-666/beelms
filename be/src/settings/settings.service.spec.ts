import type { Repository } from 'typeorm';
import { SettingsService } from './settings.service';
import type {
  InstanceBranding,
  InstanceConfig,
  InstanceFeatures,
  InstanceLanguages,
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
    cursorUrl: null,
    cursorLightUrl: null,
    cursorDarkUrl: null,
    cursorHotspot: null,
    faviconUrl: null,
    googleFont: null,
    googleFontByLang: null,
    fontUrl: null,
    fontUrlByLang: null,
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

  const defaultLanguages: InstanceLanguages = {
    supported: ['bg'],
    default: 'bg',
  };

  const buildConfig = (
    overrides: Partial<InstanceConfig> = {},
  ): InstanceConfig => ({
    id: 'cfg-id',
    branding: defaultBranding,
    features: defaultFeatures,
    languages: defaultLanguages,
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

    expect(repo.save).toHaveBeenCalledTimes(1);
    const saveMock = repo.save as jest.MockedFunction<
      (config: InstanceConfig) => Promise<InstanceConfig>
    >;
    const savedConfig = saveMock.mock.calls[0][0];
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
    cursorUrl: null,
    cursorHotspot: null,
    faviconUrl: null,
    googleFont: null,
    googleFontByLang: null,
    fontUrl: null,
    fontUrlByLang: null,
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

  const defaultLanguages: InstanceLanguages = {
    supported: ['bg'],
    default: 'bg',
  };

  const buildConfig = (
    overrides: Partial<InstanceConfig> = {},
  ): InstanceConfig => ({
    id: 'cfg-id',
    branding: defaultBranding,
    features: defaultFeatures,
    languages: defaultLanguages,
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

    expect(repo.save).toHaveBeenCalledTimes(1);
    const saveMock = repo.save as jest.MockedFunction<
      (config: InstanceConfig) => Promise<InstanceConfig>
    >;
    const savedConfig = saveMock.mock.calls[0][0];

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
