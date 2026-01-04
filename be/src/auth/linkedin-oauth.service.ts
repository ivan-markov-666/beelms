import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { SocialOAuthStateService } from './social-oauth-state.service';
import { SettingsService } from '../settings/settings.service';

export interface LinkedinProfile {
  email: string;
  emailVerified: boolean;
  givenName?: string;
  familyName?: string;
  picture?: string;
  redirectPath: string;
}

type LinkedinTokenResponse = {
  access_token?: string;
  expires_in?: number;
  token_type?: string;
  error?: string;
  error_description?: string;
};

type LinkedinUserInfoResponse = {
  sub?: string;
  email?: string;
  email_verified?: boolean;
  given_name?: string;
  family_name?: string;
  picture?: string;
};

@Injectable()
export class LinkedinOAuthService {
  private readonly frontendOrigin: string;

  constructor(
    private readonly stateService: SocialOAuthStateService,
    private readonly settingsService: SettingsService,
  ) {
    this.frontendOrigin =
      process.env.FRONTEND_ORIGIN ?? 'http://localhost:3001';
  }

  async isConfigured(): Promise<boolean> {
    const creds =
      await this.settingsService.getEffectiveSocialProviderCredentials(
        'linkedin',
      );
    return Boolean(creds?.clientId && creds.clientSecret && creds.redirectUri);
  }

  async createAuthorizationUrl(redirectPath?: string): Promise<{
    url: string;
    state: string;
  }> {
    const creds = await this.getCredentialsOrThrow();
    const normalizedRedirectPath = this.normalizeRedirectPath(redirectPath);
    const state = this.stateService.createState({
      provider: 'linkedin',
      redirectPath: normalizedRedirectPath,
    });

    const url = new URL('https://www.linkedin.com/oauth/v2/authorization');
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('client_id', creds.clientId);
    url.searchParams.set('redirect_uri', creds.redirectUri);
    url.searchParams.set('scope', 'openid profile email');
    url.searchParams.set('state', state);

    return { url: url.toString(), state };
  }

  async exchangeCodeForProfile(
    code: string,
    state: string,
  ): Promise<LinkedinProfile> {
    const statePayload = this.stateService.verifyState(state);
    if (statePayload.provider !== 'linkedin') {
      throw new BadRequestException('invalid oauth provider');
    }

    const token = await this.exchangeCodeForToken(code);
    const userInfo = await this.fetchLinkedinUser(token);

    if (!userInfo.email) {
      throw new BadRequestException('LinkedIn account does not expose email');
    }

    return {
      email: userInfo.email.trim().toLowerCase(),
      emailVerified: Boolean(userInfo.email_verified ?? true),
      givenName: userInfo.given_name ?? undefined,
      familyName: userInfo.family_name ?? undefined,
      picture: userInfo.picture ?? undefined,
      redirectPath: statePayload.redirectPath,
    };
  }

  buildFrontendRedirectUrl(params: {
    redirectPath: string;
    token?: string;
    error?: string;
  }): string {
    const target = new URL('/auth/social-callback', this.frontendOrigin);
    target.searchParams.set('provider', 'linkedin');
    target.searchParams.set('redirect', params.redirectPath);
    if (params.token) {
      target.searchParams.set('token', params.token);
    }
    if (params.error) {
      target.searchParams.set('error', params.error);
    }
    return target.toString();
  }

  extractRedirectPathFromState(state?: string): string {
    if (!state) {
      return '/auth/login';
    }

    try {
      const payload = this.stateService.verifyState(state);
      if (payload.provider === 'linkedin') {
        return this.normalizeRedirectPath(payload.redirectPath);
      }
    } catch {
      // ignore invalid state
    }

    return '/auth/login';
  }

  private async exchangeCodeForToken(code: string): Promise<string> {
    const creds = await this.getCredentialsOrThrow();
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: creds.redirectUri,
      client_id: creds.clientId,
      client_secret: creds.clientSecret,
    });

    const res = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });

    if (!res.ok) {
      throw new BadRequestException('failed to exchange LinkedIn code');
    }

    const data = (await res.json()) as LinkedinTokenResponse;
    if (!data.access_token) {
      throw new BadRequestException('missing LinkedIn access token');
    }

    return data.access_token;
  }

  private async fetchLinkedinUser(
    accessToken: string,
  ): Promise<LinkedinUserInfoResponse> {
    const res = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Cache-Control': 'no-cache',
      },
    });

    if (!res.ok) {
      throw new BadRequestException('failed to fetch LinkedIn profile');
    }

    return (await res.json()) as LinkedinUserInfoResponse;
  }

  private normalizeRedirectPath(path?: string): string {
    if (!path || !path.startsWith('/')) {
      return '/wiki';
    }
    return path;
  }

  private async getCredentialsOrThrow(): Promise<{
    clientId: string;
    clientSecret: string;
    redirectUri: string;
  }> {
    const creds =
      await this.settingsService.getEffectiveSocialProviderCredentials(
        'linkedin',
      );
    if (!creds?.clientId || !creds.clientSecret || !creds.redirectUri) {
      throw new ServiceUnavailableException('LinkedIn OAuth not configured');
    }
    return {
      clientId: creds.clientId,
      clientSecret: creds.clientSecret,
      redirectUri: creds.redirectUri,
    };
  }
}
