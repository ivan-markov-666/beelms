import {
  IsArray,
  IsBoolean,
  IsInt,
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Matches,
  Min,
  ArrayMinSize,
  Validate,
  ValidateIf,
  ValidateNested,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { Type } from 'class-transformer';

export class AdminUpdateCursorHotspotDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(255)
  x?: number | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(255)
  y?: number | null;
}

export class AdminUpdatePageLinkBySlugDto {
  @IsOptional()
  @IsBoolean()
  header?: boolean;

  @IsOptional()
  @IsBoolean()
  footer?: boolean;
}

export class AdminUpdatePageLinksDto {
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsObject()
  bySlug?: Record<string, AdminUpdatePageLinkBySlugDto> | null;
}

export class AdminUpdateHeaderMenuItemDto {
  @IsString()
  id: string;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  label?: string | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsObject()
  labelByLang?: Record<string, string | null> | null;

  @IsString()
  href: string;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsBoolean()
  clickable?: boolean;

  @IsOptional()
  @IsBoolean()
  newTab?: boolean;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AdminUpdateHeaderMenuItemDto)
  children?: AdminUpdateHeaderMenuItemDto[] | null;
}

export class AdminUpdateHeaderMenuDto {
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AdminUpdateHeaderMenuItemDto)
  items?: AdminUpdateHeaderMenuItemDto[] | null;
}

export class AdminUpdatePoweredByBeeLmsDto {
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  url?: string | null;
}

@ValidatorConstraint({ name: 'footerSocialUrlMatch', async: false })
class FooterSocialUrlMatchConstraint implements ValidatorConstraintInterface {
  validate(url: unknown, args: ValidationArguments): boolean {
    const obj = args.object as AdminUpdateFooterSocialLinkDto;
    const raw = typeof url === 'string' ? url.trim() : '';
    if (!raw) return true;
    let parsed: URL;
    try {
      parsed = new URL(raw);
    } catch {
      return false;
    }
    const protocolOk =
      parsed.protocol === 'http:' || parsed.protocol === 'https:';
    if (!protocolOk) return false;

    const host = parsed.hostname.toLowerCase();
    if (obj.type === 'facebook') {
      return (
        host === 'facebook.com' ||
        host === 'www.facebook.com' ||
        host.endsWith('.facebook.com')
      );
    }
    if (obj.type === 'youtube') {
      return (
        host === 'youtube.com' ||
        host === 'www.youtube.com' ||
        host.endsWith('.youtube.com') ||
        host === 'youtu.be' ||
        host.endsWith('.youtu.be')
      );
    }
    if (obj.type === 'x') {
      return (
        host === 'x.com' ||
        host === 'www.x.com' ||
        host.endsWith('.x.com') ||
        host === 'twitter.com' ||
        host === 'www.twitter.com' ||
        host.endsWith('.twitter.com')
      );
    }
    return true;
  }

  defaultMessage(args: ValidationArguments): string {
    const obj = args.object as AdminUpdateFooterSocialLinkDto;
    if (obj.type === 'facebook') return 'URL must point to facebook.com';
    if (obj.type === 'youtube') {
      return 'URL must point to youtube.com or youtu.be';
    }
    if (obj.type === 'x') return 'URL must point to x.com or twitter.com';
    return 'Invalid URL';
  }
}

class ThemeHexColorConstraint {
  static readonly REGEX = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
}

export class AdminUpdateThemePaletteDto {
  @IsOptional()
  @IsString()
  @Matches(ThemeHexColorConstraint.REGEX)
  background?: string | null;

  @IsOptional()
  @IsString()
  @Matches(ThemeHexColorConstraint.REGEX)
  foreground?: string | null;

  @IsOptional()
  @IsString()
  @Matches(ThemeHexColorConstraint.REGEX)
  primary?: string | null;

  @IsOptional()
  @IsString()
  @Matches(ThemeHexColorConstraint.REGEX)
  secondary?: string | null;

  @IsOptional()
  @IsString()
  @Matches(ThemeHexColorConstraint.REGEX)
  attention?: string | null;

  @IsOptional()
  @IsString()
  @Matches(ThemeHexColorConstraint.REGEX)
  error?: string | null;

  @IsOptional()
  @IsString()
  @Matches(ThemeHexColorConstraint.REGEX)
  card?: string | null;

  @IsOptional()
  @IsString()
  @Matches(ThemeHexColorConstraint.REGEX)
  border?: string | null;

  @IsOptional()
  @IsString()
  @Matches(ThemeHexColorConstraint.REGEX)
  scrollThumb?: string | null;

  @IsOptional()
  @IsString()
  @Matches(ThemeHexColorConstraint.REGEX)
  scrollTrack?: string | null;

  @IsOptional()
  @IsString()
  @Matches(ThemeHexColorConstraint.REGEX)
  fieldOkBg?: string | null;

  @IsOptional()
  @IsString()
  @Matches(ThemeHexColorConstraint.REGEX)
  fieldOkBorder?: string | null;

  @IsOptional()
  @IsString()
  @Matches(ThemeHexColorConstraint.REGEX)
  fieldAlertBg?: string | null;

  @IsOptional()
  @IsString()
  @Matches(ThemeHexColorConstraint.REGEX)
  fieldAlertBorder?: string | null;

  @IsOptional()
  @IsString()
  @Matches(ThemeHexColorConstraint.REGEX)
  fieldErrorBg?: string | null;

  @IsOptional()
  @IsString()
  @Matches(ThemeHexColorConstraint.REGEX)
  fieldErrorBorder?: string | null;
}

export class AdminUpdateThemeDto {
  @IsOptional()
  @IsString()
  @IsIn(['light', 'dark', 'system'])
  mode?: 'light' | 'dark' | 'system' | null;

  @IsOptional()
  @ValidateNested()
  @Type(() => AdminUpdateThemePaletteDto)
  light?: AdminUpdateThemePaletteDto | null;

  @IsOptional()
  @ValidateNested()
  @Type(() => AdminUpdateThemePaletteDto)
  dark?: AdminUpdateThemePaletteDto | null;
}

export class AdminUpdateThemePresetPaletteDto {
  @IsOptional()
  @IsString()
  @Matches(ThemeHexColorConstraint.REGEX)
  background?: string | null;

  @IsOptional()
  @IsString()
  @Matches(ThemeHexColorConstraint.REGEX)
  foreground?: string | null;

  @IsOptional()
  @IsString()
  @Matches(ThemeHexColorConstraint.REGEX)
  primary?: string | null;

  @IsOptional()
  @IsString()
  @Matches(ThemeHexColorConstraint.REGEX)
  secondary?: string | null;

  @IsOptional()
  @IsString()
  @Matches(ThemeHexColorConstraint.REGEX)
  attention?: string | null;

  @IsOptional()
  @IsString()
  @Matches(ThemeHexColorConstraint.REGEX)
  error?: string | null;

  @IsOptional()
  @IsString()
  @Matches(ThemeHexColorConstraint.REGEX)
  card?: string | null;

  @IsOptional()
  @IsString()
  @Matches(ThemeHexColorConstraint.REGEX)
  border?: string | null;

  @IsOptional()
  @IsString()
  @Matches(ThemeHexColorConstraint.REGEX)
  scrollThumb?: string | null;

  @IsOptional()
  @IsString()
  @Matches(ThemeHexColorConstraint.REGEX)
  scrollTrack?: string | null;

  @IsOptional()
  @IsString()
  @Matches(ThemeHexColorConstraint.REGEX)
  fieldOkBg?: string | null;

  @IsOptional()
  @IsString()
  @Matches(ThemeHexColorConstraint.REGEX)
  fieldOkBorder?: string | null;

  @IsOptional()
  @IsString()
  @Matches(ThemeHexColorConstraint.REGEX)
  fieldAlertBg?: string | null;

  @IsOptional()
  @IsString()
  @Matches(ThemeHexColorConstraint.REGEX)
  fieldAlertBorder?: string | null;

  @IsOptional()
  @IsString()
  @Matches(ThemeHexColorConstraint.REGEX)
  fieldErrorBg?: string | null;

  @IsOptional()
  @IsString()
  @Matches(ThemeHexColorConstraint.REGEX)
  fieldErrorBorder?: string | null;
}

export class AdminUpdateThemePresetDto {
  @IsString()
  id: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string | null;

  @ValidateNested()
  @Type(() => AdminUpdateThemePresetPaletteDto)
  light: AdminUpdateThemePresetPaletteDto;

  @ValidateNested()
  @Type(() => AdminUpdateThemePresetPaletteDto)
  dark: AdminUpdateThemePresetPaletteDto;
}

@ValidatorConstraint({ name: 'twitterCardConsistency', async: false })
class TwitterCardConsistencyConstraint implements ValidatorConstraintInterface {
  validate(card: unknown, args: ValidationArguments): boolean {
    const dto = args.object as AdminUpdateTwitterDto;
    const normalizedCard =
      typeof card === 'string' ? card.trim().toLowerCase() : '';

    if (!normalizedCard || normalizedCard === 'summary') {
      return true;
    }

    if (normalizedCard === 'summary_large_image') {
      return true;
    }

    if (normalizedCard === 'app') {
      const name = (dto.app?.name ?? '').trim();
      const iphoneId = (dto.app?.id?.iphone ?? '').trim();
      return name.length > 0 && iphoneId.length > 0;
    }

    if (normalizedCard === 'player') {
      const url = (dto.player?.url ?? '').trim();
      const width = dto.player?.width;
      const height = dto.player?.height;
      return (
        url.length > 0 &&
        typeof width === 'number' &&
        typeof height === 'number'
      );
    }

    return true;
  }

  defaultMessage(args: ValidationArguments): string {
    const card = typeof args.value === 'string' ? args.value : '';
    return `twitter.card=${card} is missing required nested fields`;
  }
}

export class AdminUpdateSocialImageDto {
  @IsOptional()
  @IsString()
  imageUrl?: string | null;
}

export class AdminUpdateOpenGraphDto {
  @IsOptional()
  @IsString()
  title?: string | null;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsString()
  imageUrl?: string | null;
}

export class AdminUpdateTwitterAppIdDto {
  @IsOptional()
  @IsString()
  iphone?: string | null;

  @IsOptional()
  @IsString()
  ipad?: string | null;

  @IsOptional()
  @IsString()
  googleplay?: string | null;
}

export class AdminUpdateTwitterAppUrlDto {
  @IsOptional()
  @IsString()
  iphone?: string | null;

  @IsOptional()
  @IsString()
  ipad?: string | null;

  @IsOptional()
  @IsString()
  googleplay?: string | null;
}

export class AdminUpdateTwitterAppDto {
  @IsOptional()
  @IsString()
  name?: string | null;

  @IsOptional()
  @ValidateNested()
  @Type(() => AdminUpdateTwitterAppIdDto)
  id?: AdminUpdateTwitterAppIdDto | null;

  @IsOptional()
  @ValidateNested()
  @Type(() => AdminUpdateTwitterAppUrlDto)
  url?: AdminUpdateTwitterAppUrlDto | null;
}

export class AdminUpdateTwitterPlayerDto {
  @IsOptional()
  @IsString()
  url?: string | null;

  @IsOptional()
  @IsInt()
  width?: number | null;

  @IsOptional()
  @IsInt()
  height?: number | null;

  @IsOptional()
  @IsString()
  stream?: string | null;

  @IsOptional()
  @IsString()
  streamContentType?: string | null;
}

export class AdminUpdateTwitterDto {
  @IsOptional()
  @IsString()
  title?: string | null;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsString()
  imageUrl?: string | null;

  @IsOptional()
  @IsString()
  @Validate(TwitterCardConsistencyConstraint)
  card?: string | null;

  @IsOptional()
  @ValidateNested()
  @Type(() => AdminUpdateTwitterAppDto)
  app?: AdminUpdateTwitterAppDto | null;

  @IsOptional()
  @ValidateNested()
  @Type(() => AdminUpdateTwitterPlayerDto)
  player?: AdminUpdateTwitterPlayerDto | null;
}

export class AdminUpdateFooterSocialLinkDto {
  @IsString()
  id: string;

  @IsString()
  @IsIn(['facebook', 'x', 'youtube', 'custom'])
  type: 'facebook' | 'x' | 'youtube' | 'custom';

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  label?: string | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @Validate(FooterSocialUrlMatchConstraint)
  url?: string | null;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @IsIn([
    'whatsapp',
    'messenger',
    'signal',
    'skype',
    'imessage',
    'wechat',
    'line',
    'kakaotalk',
    'threema',
    'icq',
    'instagram',
    'tiktok',
    'snapchat',
    'pinterest',
    'threads',
    'bereal',
    'tumblr',
    'bluesky',
    'mastodon',
    'vk',
    'zoom',
    'teams',
    'slack',
    'google-meet',
    'google-chat',
    'reddit',
    'twitch',
    'quora',
    'clubhouse',
    'tinder',
    'github',
    'npm',
    'maven',
    'nuget',
    'pypi',
    'linkedin',
    'discord',
    'telegram',
    'viber',
    'phone',
    'location',
    'link',
    'globe',
  ])
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

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  iconLightUrl?: string | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  iconDarkUrl?: string | null;
}

export class AdminUpdateSocialLoginIconDto {
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  lightUrl?: string | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  darkUrl?: string | null;
}

export class AdminUpdateSocialLoginIconsDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => AdminUpdateSocialLoginIconDto)
  google?: AdminUpdateSocialLoginIconDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => AdminUpdateSocialLoginIconDto)
  facebook?: AdminUpdateSocialLoginIconDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => AdminUpdateSocialLoginIconDto)
  github?: AdminUpdateSocialLoginIconDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => AdminUpdateSocialLoginIconDto)
  linkedin?: AdminUpdateSocialLoginIconDto;
}

@ValidatorConstraint({ name: 'appName', async: false })
export class AppNameConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    if (typeof value !== 'string') return false;

    const trimmed = value.trim();

    // Length validation: 2-32 characters
    if (trimmed.length < 2 || trimmed.length > 32) return false;

    // No control characters allowed
    for (let i = 0; i < trimmed.length; i++) {
      const charCode = trimmed.charCodeAt(i);
      if (charCode <= 31 || charCode === 127) return false;
    }

    // Must contain at least one Unicode letter or digit
    const hasLetterOrDigit = /[\p{L}\p{N}]/u.test(trimmed);
    if (!hasLetterOrDigit) return false;

    // Block HTML tags to prevent XSS
    const hasHtmlTags = /<[a-z][\s\S]*>/i.test(trimmed);
    if (hasHtmlTags) return false;

    return true;
  }

  defaultMessage(): string {
    return 'App name must be 2-32 characters, contain no control characters/HTML, and include at least one letter or digit';
  }
}

export class AdminUpdateBrandingDto {
  @IsOptional()
  @IsString()
  @Validate(AppNameConstraint)
  appName?: string;

  @IsOptional()
  @IsString()
  browserTitle?: string | null;

  @IsOptional()
  @IsString()
  notFoundTitle?: string | null;

  @IsOptional()
  @IsString()
  notFoundMarkdown?: string | null;

  @IsOptional()
  @ValidateNested()
  @Type(() => AdminUpdatePoweredByBeeLmsDto)
  poweredByBeeLms?: AdminUpdatePoweredByBeeLmsDto | null;

  @IsOptional()
  @ValidateNested()
  @Type(() => AdminUpdatePageLinksDto)
  pageLinks?: AdminUpdatePageLinksDto | null;

  @IsOptional()
  @ValidateNested()
  @Type(() => AdminUpdateHeaderMenuDto)
  headerMenu?: AdminUpdateHeaderMenuDto | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsObject()
  notFoundTitleByLang?: Record<string, string | null> | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsObject()
  notFoundMarkdownByLang?: Record<string, string | null> | null;

  @IsOptional()
  @IsBoolean()
  loginSocialUnavailableMessageEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  loginSocialResetPasswordHintEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  registerSocialUnavailableMessageEnabled?: boolean;

  @IsOptional()
  @IsString()
  cursorUrl?: string | null;

  @IsOptional()
  @IsString()
  cursorLightUrl?: string | null;

  @IsOptional()
  @IsString()
  cursorDarkUrl?: string | null;

  @IsOptional()
  @IsString()
  cursorPointerUrl?: string | null;

  @IsOptional()
  @IsString()
  cursorPointerLightUrl?: string | null;

  @IsOptional()
  @IsString()
  cursorPointerDarkUrl?: string | null;

  @IsOptional()
  @ValidateNested()
  @Type(() => AdminUpdateCursorHotspotDto)
  cursorHotspot?: AdminUpdateCursorHotspotDto | null;

  @IsOptional()
  @IsString()
  faviconUrl?: string | null;

  @IsOptional()
  @IsString()
  googleFont?: string | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsObject()
  googleFontByLang?: Record<string, string | null> | null;

  @IsOptional()
  @IsString()
  fontUrl?: string | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsObject()
  fontUrlByLang?: Record<string, string | null> | null;

  @IsOptional()
  @IsString()
  fontLicenseUrl?: string | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsObject()
  fontLicenseUrlByLang?: Record<string, string | null> | null;

  @IsOptional()
  @ValidateNested()
  @Type(() => AdminUpdateThemeDto)
  theme?: AdminUpdateThemeDto | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AdminUpdateThemePresetDto)
  customThemePresets?: AdminUpdateThemePresetDto[] | null;

  @IsOptional()
  @IsString()
  logoUrl?: string | null;

  @IsOptional()
  @IsString()
  logoLightUrl?: string | null;

  @IsOptional()
  @IsString()
  logoDarkUrl?: string | null;

  @IsOptional()
  @IsString()
  primaryColor?: string | null;

  @IsOptional()
  @ValidateNested()
  @Type(() => AdminUpdateSocialImageDto)
  socialImage?: AdminUpdateSocialImageDto | null;

  @IsOptional()
  @IsString()
  socialDescription?: string | null;

  @IsOptional()
  @ValidateNested()
  @Type(() => AdminUpdateOpenGraphDto)
  openGraph?: AdminUpdateOpenGraphDto | null;

  @IsOptional()
  @ValidateNested()
  @Type(() => AdminUpdateTwitterDto)
  twitter?: AdminUpdateTwitterDto | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AdminUpdateFooterSocialLinkDto)
  footerSocialLinks?: AdminUpdateFooterSocialLinkDto[] | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @ValidateNested()
  @Type(() => AdminUpdateSocialLoginIconsDto)
  socialLoginIcons?: AdminUpdateSocialLoginIconsDto | null;
}

export class AdminUpdateFeaturesDto {
  @IsOptional()
  @IsBoolean()
  wiki?: boolean;

  @IsOptional()
  @IsBoolean()
  wikiPublic?: boolean;

  @IsOptional()
  @IsBoolean()
  courses?: boolean;

  @IsOptional()
  @IsBoolean()
  coursesPublic?: boolean;

  @IsOptional()
  @IsBoolean()
  myCourses?: boolean;

  @IsOptional()
  @IsBoolean()
  profile?: boolean;

  @IsOptional()
  @IsBoolean()
  accessibilityWidget?: boolean;

  @IsOptional()
  @IsBoolean()
  seo?: boolean;

  @IsOptional()
  @IsBoolean()
  themeLight?: boolean;

  @IsOptional()
  @IsBoolean()
  themeDark?: boolean;

  @IsOptional()
  @IsBoolean()
  themeModeSelector?: boolean;

  @IsOptional()
  @IsBoolean()
  auth?: boolean;

  @IsOptional()
  @IsBoolean()
  authLogin?: boolean;

  @IsOptional()
  @IsBoolean()
  authRegister?: boolean;

  @IsOptional()
  @IsBoolean()
  auth2fa?: boolean;

  @IsOptional()
  @IsBoolean()
  captcha?: boolean;

  @IsOptional()
  @IsBoolean()
  captchaLogin?: boolean;

  @IsOptional()
  @IsBoolean()
  captchaRegister?: boolean;

  @IsOptional()
  @IsBoolean()
  captchaForgotPassword?: boolean;

  @IsOptional()
  @IsBoolean()
  captchaChangePassword?: boolean;

  @IsOptional()
  @IsBoolean()
  paidCourses?: boolean;

  @IsOptional()
  @IsBoolean()
  paymentsStripe?: boolean;

  @IsOptional()
  @IsBoolean()
  paymentsPaypal?: boolean;

  @IsOptional()
  @IsBoolean()
  paymentsMypos?: boolean;

  @IsOptional()
  @IsBoolean()
  paymentsRevolut?: boolean;

  @IsOptional()
  @IsBoolean()
  gdprLegal?: boolean;

  @IsOptional()
  @IsBoolean()
  pageTerms?: boolean;

  @IsOptional()
  @IsBoolean()
  pagePrivacy?: boolean;

  @IsOptional()
  @IsBoolean()
  pageCookiePolicy?: boolean;

  @IsOptional()
  @IsBoolean()
  pageImprint?: boolean;

  @IsOptional()
  @IsBoolean()
  pageAccessibility?: boolean;

  @IsOptional()
  @IsBoolean()
  pageContact?: boolean;

  @IsOptional()
  @IsBoolean()
  pageFaq?: boolean;

  @IsOptional()
  @IsBoolean()
  pageSupport?: boolean;

  @IsOptional()
  @IsBoolean()
  pageNotFound?: boolean;

  @IsOptional()
  @IsBoolean()
  socialGoogle?: boolean;

  @IsOptional()
  @IsBoolean()
  socialFacebook?: boolean;

  @IsOptional()
  @IsBoolean()
  socialGithub?: boolean;

  @IsOptional()
  @IsBoolean()
  socialLinkedin?: boolean;

  @IsOptional()
  @IsBoolean()
  infraRedis?: boolean;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  infraRedisUrl?: string | null;

  @IsOptional()
  @IsBoolean()
  infraRabbitmq?: boolean;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  infraRabbitmqUrl?: string | null;

  @IsOptional()
  @IsBoolean()
  infraMonitoring?: boolean;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  infraMonitoringUrl?: string | null;

  @IsOptional()
  @IsBoolean()
  infraErrorTracking?: boolean;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  infraErrorTrackingUrl?: string | null;
}

export class AdminUpdateSeoRobotsDto {
  @IsOptional()
  @IsBoolean()
  index?: boolean;
}

export class AdminUpdateSeoSitemapDto {
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsBoolean()
  includeWiki?: boolean;

  @IsOptional()
  @IsBoolean()
  includeCourses?: boolean;

  @IsOptional()
  @IsBoolean()
  includeLegal?: boolean;
}

export class AdminUpdateSeoDto {
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  baseUrl?: string | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  titleTemplate?: string | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  defaultTitle?: string | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  defaultDescription?: string | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @ValidateNested()
  @Type(() => AdminUpdateSeoRobotsDto)
  robots?: AdminUpdateSeoRobotsDto | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @ValidateNested()
  @Type(() => AdminUpdateSeoSitemapDto)
  sitemap?: AdminUpdateSeoSitemapDto | null;
}

export class AdminUpdateLanguagesDto {
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  supported?: string[];

  @IsOptional()
  @IsString()
  default?: string;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsObject()
  icons?: Record<
    string,
    { lightUrl?: string | null; darkUrl?: string | null } | null
  > | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @ValidateNested()
  @Type(() => AdminUpdateLanguagesFlagPickerDto)
  flagPicker?: AdminUpdateLanguagesFlagPickerDto | null;
}

export class AdminUpdateLanguagesFlagPickerDto {
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  global?: string | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsObject()
  byLang?: Record<string, string | null> | null;
}

export class AdminUpdateSocialProviderCredentialsDto {
  @IsOptional()
  @IsString()
  clientId?: string | null;

  @IsOptional()
  @IsString()
  clientSecret?: string | null;

  @IsOptional()
  @IsString()
  redirectUri?: string | null;

  @IsOptional()
  @IsString()
  notes?: string | null;
}

export class AdminUpdateSocialCredentialsDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => AdminUpdateSocialProviderCredentialsDto)
  google?: AdminUpdateSocialProviderCredentialsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => AdminUpdateSocialProviderCredentialsDto)
  facebook?: AdminUpdateSocialProviderCredentialsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => AdminUpdateSocialProviderCredentialsDto)
  github?: AdminUpdateSocialProviderCredentialsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => AdminUpdateSocialProviderCredentialsDto)
  linkedin?: AdminUpdateSocialProviderCredentialsDto;
}

export class AdminUpdateInstanceSettingsDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => AdminUpdateBrandingDto)
  branding?: AdminUpdateBrandingDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => AdminUpdateThemeDto)
  theme?: AdminUpdateThemeDto | null;

  @IsOptional()
  @ValidateNested()
  @Type(() => AdminUpdateFeaturesDto)
  features?: AdminUpdateFeaturesDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => AdminUpdateLanguagesDto)
  languages?: AdminUpdateLanguagesDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => AdminUpdateSeoDto)
  seo?: AdminUpdateSeoDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => AdminUpdateSocialCredentialsDto)
  socialCredentials?: AdminUpdateSocialCredentialsDto;
}
