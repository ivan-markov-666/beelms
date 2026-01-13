import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { InstanceConfig } from '../settings/instance-config.entity';

const SeedDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USER ?? 'beelms',
  password: process.env.DB_PASSWORD ?? 'beelms',
  database: process.env.DB_NAME ?? 'beelms',
  entities: [InstanceConfig],
  synchronize: false,
});

async function seedInstanceConfig() {
  await SeedDataSource.initialize();

  const repo = SeedDataSource.getRepository(InstanceConfig);

  await repo.clear();

  const cfg = repo.create({
    branding: {
      appName: 'BeeLMS',
      browserTitle: 'BeeLMS',
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
      cursorUrl: null,
      cursorLightUrl: null,
      cursorDarkUrl: null,
      cursorPointerUrl: null,
      cursorPointerLightUrl: null,
      cursorPointerDarkUrl: null,
      logoUrl: null,
      logoLightUrl: null,
      logoDarkUrl: null,
      primaryColor: null,
      socialImage: null,
      socialDescription: null,
      openGraph: null,
      twitter: null,
      footerSocialLinks: [
        {
          id: 'facebook',
          type: 'facebook',
          label: 'Facebook',
          url: null,
          enabled: false,
          iconLightUrl: null,
          iconDarkUrl: null,
        },
        {
          id: 'x',
          type: 'x',
          label: 'X',
          url: null,
          enabled: false,
          iconLightUrl: null,
          iconDarkUrl: null,
        },
        {
          id: 'youtube',
          type: 'youtube',
          label: 'YouTube',
          url: null,
          enabled: false,
          iconLightUrl: null,
          iconDarkUrl: null,
        },
      ],
    },
    features: {
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
      infraRabbitmq: false,
      infraMonitoring: true,
      infraErrorTracking: false,
    },
    languages: {
      supported: ['bg', 'en', 'de'],
      default: 'bg',
    },
    socialCredentials: null,
  });

  await repo.save(cfg);

  await SeedDataSource.destroy();
}

seedInstanceConfig()
  .then(() => {
    console.log('Instance config seed completed');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Instance config seed failed', err);
    process.exit(1);
  });
