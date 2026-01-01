import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { SettingsService } from '../settings/settings.service';
import type { InstanceFeatures } from '../settings/instance-config.entity';
import type { SocialProvider } from './social-oauth-state.service';
import { GoogleOAuthService } from './google-oauth.service';
import { FacebookOAuthService } from './facebook-oauth.service';
import { GithubOAuthService } from './github-oauth.service';
import { LinkedinOAuthService } from './linkedin-oauth.service';

const PROVIDER_FEATURE_MAP: Record<SocialProvider, keyof InstanceFeatures> = {
  google: 'socialGoogle',
  facebook: 'socialFacebook',
  github: 'socialGithub',
  linkedin: 'socialLinkedin',
};

export type SocialProviderStatus = {
  enabled: boolean;
  configured: boolean;
};

@Injectable()
export class SocialLoginAvailabilityService {
  constructor(
    private readonly settingsService: SettingsService,
    private readonly googleOAuthService: GoogleOAuthService,
    private readonly facebookOAuthService: FacebookOAuthService,
    private readonly githubOAuthService: GithubOAuthService,
    private readonly linkedinOAuthService: LinkedinOAuthService,
  ) {}

  private get providers(): SocialProvider[] {
    return ['google', 'facebook', 'github', 'linkedin'];
  }

  async isEnabled(provider: SocialProvider): Promise<boolean> {
    const statuses = await this.getProviderStatuses();
    return statuses[provider]?.enabled ?? false;
  }

  async ensureEnabled(provider: SocialProvider): Promise<void> {
    const enabled = await this.isEnabled(provider);
    if (!enabled) {
      throw new ServiceUnavailableException(`${provider} login is disabled`);
    }
  }

  async getProviderStatuses(
    features?: InstanceFeatures,
  ): Promise<Record<SocialProvider, SocialProviderStatus>> {
    const featureState =
      features ??
      (await this.settingsService.getOrCreateInstanceConfig()).features;

    const statuses = {} as Record<SocialProvider, SocialProviderStatus>;
    for (const provider of this.providers) {
      const featureKey = PROVIDER_FEATURE_MAP[provider];
      statuses[provider] = {
        enabled: featureState?.[featureKey] !== false,
        configured: this.isProviderConfigured(provider),
      };
    }

    return statuses;
  }

  private isProviderConfigured(provider: SocialProvider): boolean {
    switch (provider) {
      case 'google':
        return this.googleOAuthService.isConfigured();
      case 'facebook':
        return this.facebookOAuthService.isConfigured();
      case 'github':
        return this.githubOAuthService.isConfigured();
      case 'linkedin':
        return this.linkedinOAuthService.isConfigured();
      default:
        return false;
    }
  }
}
