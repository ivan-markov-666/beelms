import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export type SocialProviderName = 'google' | 'facebook' | 'github' | 'linkedin';

type HeaderMenuItem = {
  id: string;
  label?: string | null;
  labelByLang?: Record<string, string | null> | null;
  href: string;
  enabled?: boolean;
  clickable?: boolean;
  newTab?: boolean;
  children?: HeaderMenuItem[] | null;
};

export type InstanceBranding = {
  appName: string;
  browserTitle?: string | null;
  notFoundTitle?: string | null;
  notFoundMarkdown?: string | null;
  notFoundTitleByLang?: Record<string, string | null> | null;
  notFoundMarkdownByLang?: Record<string, string | null> | null;
  loginSocialUnavailableMessageEnabled?: boolean;
  loginSocialResetPasswordHintEnabled?: boolean;
  registerSocialUnavailableMessageEnabled?: boolean;
  headerMenu?: {
    enabled?: boolean;
    items?: HeaderMenuItem[] | null;
  } | null;
  pageLinks?: {
    enabled?: boolean;
    bySlug?: Record<
      string,
      {
        url?: boolean;
        header?: boolean;
        footer?: boolean;
      }
    > | null;
  } | null;
  poweredByBeeLms?: {
    enabled?: boolean;
    url?: string | null;
  } | null;
  cursorUrl?: string | null;
  cursorLightUrl?: string | null;
  cursorDarkUrl?: string | null;
  cursorPointerUrl?: string | null;
  cursorPointerLightUrl?: string | null;
  cursorPointerDarkUrl?: string | null;
  cursorHotspot?: {
    x?: number | null;
    y?: number | null;
  } | null;
  faviconUrl?: string | null;
  googleFont?: string | null;
  googleFontByLang?: Record<string, string | null> | null;
  fontUrl?: string | null;
  fontUrlByLang?: Record<string, string | null> | null;
  fontLicenseUrl?: string | null;
  fontLicenseUrlByLang?: Record<string, string | null> | null;
  customThemePresets?: Array<{
    id: string;
    name: string;
    description?: string | null;
    light: {
      background?: string | null;
      foreground?: string | null;
      primary?: string | null;
      secondary?: string | null;
      error?: string | null;
      card?: string | null;
      border?: string | null;
      scrollThumb?: string | null;
      scrollTrack?: string | null;
      fieldOkBg?: string | null;
      fieldOkBorder?: string | null;
      fieldAlertBg?: string | null;
      fieldAlertBorder?: string | null;
      fieldErrorBg?: string | null;
      fieldErrorBorder?: string | null;
    };
    dark: {
      background?: string | null;
      foreground?: string | null;
      primary?: string | null;
      secondary?: string | null;
      error?: string | null;
      card?: string | null;
      border?: string | null;
      scrollThumb?: string | null;
      scrollTrack?: string | null;
      fieldOkBg?: string | null;
      fieldOkBorder?: string | null;
      fieldErrorBg?: string | null;
      fieldErrorBorder?: string | null;
    };
    createdAt?: string | null;
    updatedAt?: string | null;
    createdBy?: string | null;
    updatedBy?: string | null;
  }> | null;
  theme?: {
    mode?: 'light' | 'dark' | 'system' | null;
    light?: {
      background?: string | null;
      foreground?: string | null;
      primary?: string | null;
      secondary?: string | null;
      error?: string | null;
      card?: string | null;
      border?: string | null;
      scrollThumb?: string | null;
      scrollTrack?: string | null;
      fieldOkBg?: string | null;
      fieldOkBorder?: string | null;
      fieldAlertBg?: string | null;
      fieldAlertBorder?: string | null;
      fieldErrorBg?: string | null;
      fieldErrorBorder?: string | null;
    } | null;
    dark?: {
      background?: string | null;
      foreground?: string | null;
      primary?: string | null;
      secondary?: string | null;
      error?: string | null;
      card?: string | null;
      border?: string | null;
      scrollThumb?: string | null;
      scrollTrack?: string | null;
      fieldOkBg?: string | null;
      fieldOkBorder?: string | null;
      fieldAlertBg?: string | null;
      fieldAlertBorder?: string | null;
      fieldErrorBg?: string | null;
      fieldErrorBorder?: string | null;
    } | null;
  } | null;
  logoUrl?: string | null;
  logoLightUrl?: string | null;
  logoDarkUrl?: string | null;
  primaryColor?: string | null;
  socialImage?: {
    imageUrl?: string | null;
  } | null;
  socialDescription?: string | null;
  openGraph?: {
    title?: string | null;
    description?: string | null;
    imageUrl?: string | null;
  } | null;
  twitter?: {
    title?: string | null;
    description?: string | null;
    imageUrl?: string | null;
    card?: string | null;
    app?: {
      name?: string | null;
      id?: {
        iphone?: string | null;
        ipad?: string | null;
        googleplay?: string | null;
      } | null;
      url?: {
        iphone?: string | null;
        ipad?: string | null;
        googleplay?: string | null;
      } | null;
    } | null;
    player?: {
      url?: string | null;
      width?: number | null;
      height?: number | null;
      stream?: string | null;
      streamContentType?: string | null;
    } | null;
  } | null;

  footerSocialLinks?: Array<{
    id: string;
    type: 'facebook' | 'x' | 'youtube' | 'custom';
    label?: string | null;
    url?: string | null;
    enabled?: boolean;
    iconKey?:
      | 'whatsapp'
      | 'messenger'
      | 'signal'
      | 'skype'
      | 'imessage'
      | 'wechat'
      | 'line'
      | 'kakaotalk'
      | 'threema'
      | 'icq'
      | 'instagram'
      | 'tiktok'
      | 'snapchat'
      | 'pinterest'
      | 'threads'
      | 'bereal'
      | 'tumblr'
      | 'bluesky'
      | 'mastodon'
      | 'vk'
      | 'zoom'
      | 'teams'
      | 'slack'
      | 'google-meet'
      | 'google-chat'
      | 'reddit'
      | 'twitch'
      | 'quora'
      | 'clubhouse'
      | 'tinder'
      | 'github'
      | 'npm'
      | 'maven'
      | 'nuget'
      | 'pypi'
      | 'linkedin'
      | 'discord'
      | 'telegram'
      | 'viber'
      | 'phone'
      | 'location'
      | 'link'
      | 'globe'
      | null;
    iconLightUrl?: string | null;
    iconDarkUrl?: string | null;
  }> | null;

  socialLoginIcons?: Partial<
    Record<
      SocialProviderName,
      {
        lightUrl?: string | null;
        darkUrl?: string | null;
      }
    >
  > | null;
};

export type SocialProviderCredentials = {
  clientId?: string | null;
  clientSecret?: string | null;
  redirectUri?: string | null;
  notes?: string | null;
  updatedBy?: string | null;
  updatedAt?: string | null;
};

export type InstanceSocialCredentials = Partial<
  Record<SocialProviderName, SocialProviderCredentials>
>;

export type InstanceSeo = {
  baseUrl?: string | null;
  titleTemplate?: string | null;
  defaultTitle?: string | null;
  defaultDescription?: string | null;
  robots?: {
    index?: boolean;
  } | null;
  sitemap?: {
    enabled?: boolean;
    includeWiki?: boolean;
    includeCourses?: boolean;
    includeLegal?: boolean;
  } | null;
};

export type InstanceFeatures = {
  wiki: boolean;
  wikiPublic: boolean;
  courses: boolean;
  coursesPublic: boolean;
  myCourses: boolean;
  profile: boolean;
  accessibilityWidget: boolean;
  seo: boolean;
  themeLight: boolean;
  themeDark: boolean;
  themeModeSelector: boolean;
  auth: boolean;
  authLogin: boolean;
  authRegister: boolean;
  auth2fa: boolean;
  captcha: boolean;
  captchaLogin: boolean;
  captchaRegister: boolean;
  captchaForgotPassword: boolean;
  captchaChangePassword: boolean;
  paidCourses: boolean;
  paymentsStripe: boolean;
  paymentsPaypal: boolean;
  paymentsMypos: boolean;
  paymentsRevolut: boolean;
  paymentsDefaultProvider?: 'stripe' | 'paypal' | 'mypos' | 'revolut';
  gdprLegal: boolean;
  pageTerms: boolean;
  pagePrivacy: boolean;
  pageCookiePolicy: boolean;
  pageImprint: boolean;
  pageAccessibility: boolean;
  pageContact: boolean;
  pageFaq: boolean;
  pageSupport: boolean;
  pageNotFound: boolean;
  socialGoogle: boolean;
  socialFacebook: boolean;
  socialGithub: boolean;
  socialLinkedin: boolean;
  infraRedis: boolean;
  infraRedisUrl?: string | null;
  infraRabbitmq: boolean;
  infraRabbitmqUrl?: string | null;
  infraMonitoring: boolean;
  infraMonitoringUrl?: string | null;
  infraErrorTracking: boolean;
  infraErrorTrackingUrl?: string | null;
};

export type InstanceLanguages = {
  supported: string[];
  default: string;
  icons?: Record<
    string,
    { lightUrl?: string | null; darkUrl?: string | null } | null
  > | null;
  flagPicker?: {
    global?: string | null;
    byLang?: Record<string, string | null> | null;
  } | null;
};

@Entity('instance_config')
export class InstanceConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'jsonb' })
  branding: InstanceBranding;

  @Column({ type: 'jsonb' })
  features: InstanceFeatures;

  @Column({ type: 'jsonb' })
  languages: InstanceLanguages;

  @Column({ type: 'jsonb', nullable: true })
  seo: InstanceSeo | null;

  @Column({ type: 'jsonb', name: 'social_credentials', nullable: true })
  socialCredentials: InstanceSocialCredentials | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
