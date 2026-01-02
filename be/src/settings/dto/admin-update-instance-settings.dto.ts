import {
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  ArrayMinSize,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class AdminUpdateBrandingDto {
  @IsOptional()
  @IsString()
  appName?: string;

  @IsOptional()
  @IsString()
  logoUrl?: string | null;

  @IsOptional()
  @IsString()
  primaryColor?: string | null;
}

export class AdminUpdateFeaturesDto {
  @IsOptional()
  @IsBoolean()
  wikiPublic?: boolean;

  @IsOptional()
  @IsBoolean()
  courses?: boolean;

  @IsOptional()
  @IsBoolean()
  auth?: boolean;

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
