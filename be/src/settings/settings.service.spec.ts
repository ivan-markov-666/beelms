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
    logoUrl: null,
    primaryColor: null,
  };

  const defaultFeatures: InstanceFeatures = {
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
