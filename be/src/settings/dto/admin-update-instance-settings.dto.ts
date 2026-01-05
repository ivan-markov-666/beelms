import {
  IsArray,
  IsBoolean,
  IsInt,
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  Matches,
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
  x?: number | null;

  @IsOptional()
  @IsInt()
  y?: number | null;
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

export class AdminUpdateBrandingDto {
  @IsOptional()
  @IsString()
  appName?: string;

  @IsOptional()
  @IsString()
  browserTitle?: string | null;

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
  @ValidateNested()
  @Type(() => AdminUpdateThemeDto)
  theme?: AdminUpdateThemeDto | null;

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
  auth?: boolean;

  @IsOptional()
  @IsBoolean()
  authLogin?: boolean;

  @IsOptional()
  @IsBoolean()
  authRegister?: boolean;

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
  gdprLegal?: boolean;

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
  @IsBoolean()
  infraRabbitmq?: boolean;

  @IsOptional()
  @IsBoolean()
  infraMonitoring?: boolean;

  @IsOptional()
  @IsBoolean()
  infraErrorTracking?: boolean;
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
  @Type(() => AdminUpdateFeaturesDto)
  features?: AdminUpdateFeaturesDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => AdminUpdateLanguagesDto)
  languages?: AdminUpdateLanguagesDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => AdminUpdateSocialCredentialsDto)
  socialCredentials?: AdminUpdateSocialCredentialsDto;
}
