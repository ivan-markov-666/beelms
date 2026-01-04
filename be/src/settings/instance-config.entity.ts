import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export type InstanceBranding = {
  appName: string;
  browserTitle?: string | null;
  cursorUrl?: string | null;
  cursorLightUrl?: string | null;
  cursorDarkUrl?: string | null;
  cursorHotspot?: {
    x?: number | null;
    y?: number | null;
  } | null;
  faviconUrl?: string | null;
  fontUrl?: string | null;
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
};

export type SocialProviderName = 'google' | 'facebook' | 'github' | 'linkedin';

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

export type InstanceFeatures = {
  wiki: boolean;
  wikiPublic: boolean;
  courses: boolean;
  coursesPublic: boolean;
  myCourses: boolean;
  profile: boolean;
  auth: boolean;
  authLogin: boolean;
  authRegister: boolean;
  captcha: boolean;
  captchaLogin: boolean;
  captchaRegister: boolean;
  captchaForgotPassword: boolean;
  captchaChangePassword: boolean;
  paidCourses: boolean;
  gdprLegal: boolean;
  socialGoogle: boolean;
  socialFacebook: boolean;
  socialGithub: boolean;
  socialLinkedin: boolean;
  infraRedis: boolean;
  infraRabbitmq: boolean;
  infraMonitoring: boolean;
  infraErrorTracking: boolean;
};

export type InstanceLanguages = {
  supported: string[];
  default: string;
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

  @Column({ type: 'jsonb', name: 'social_credentials', nullable: true })
  socialCredentials: InstanceSocialCredentials | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
