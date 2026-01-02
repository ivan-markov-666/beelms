import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { SocialOAuthStateService } from './social-oauth-state.service';
import { SettingsService } from '../settings/settings.service';

export interface FacebookProfile {
  email: string;
  givenName?: string;
  familyName?: string;
  picture?: string;
  emailVerified: boolean;
  redirectPath: string;
}

type FacebookTokenResponse = {
  access_token?: string;
  token_type?: string;
  expires_in?: number;
  error?: { message?: string };
};

type FacebookGraphUser = {
  id: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  picture?: {
    data?: {
      url?: string;
    };
  };
};

@Injectable()
export class FacebookOAuthService {
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
        'facebook',
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
      provider: 'facebook',
      redirectPath: normalizedRedirectPath,
    });

    const url = new URL('https://www.facebook.com/v19.0/dialog/oauth');
    url.searchParams.set('client_id', creds.clientId);
    url.searchParams.set('redirect_uri', creds.redirectUri);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('scope', 'email,public_profile');
    url.searchParams.set('state', state);

    return { url: url.toString(), state };
  }

  async exchangeCodeForProfile(
    code: string,
    state: string,
  ): Promise<FacebookProfile> {
    const statePayload = this.stateService.verifyState(state);
    if (statePayload.provider !== 'facebook') {
      throw new BadRequestException('invalid oauth provider');
    }

    const token = await this.exchangeCodeForToken(code);
    const graphUser = await this.fetchProfile(token);

    if (!graphUser.email) {
      throw new BadRequestException('Facebook account does not expose email');
    }

    return {
      email: graphUser.email.trim().toLowerCase(),
      emailVerified: true,
      givenName: graphUser.first_name ?? undefined,
      familyName: graphUser.last_name ?? undefined,
      picture: graphUser.picture?.data?.url ?? undefined,
      redirectPath: statePayload.redirectPath,
    };
  }

  buildFrontendRedirectUrl(params: {
    redirectPath: string;
    token?: string;
    error?: string;
  }): string {
    const target = new URL('/auth/social-callback', this.frontendOrigin);
    target.searchParams.set('provider', 'facebook');
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
      if (payload.provider === 'facebook') {
        return this.normalizeRedirectPath(payload.redirectPath);
      }
    } catch {
      // ignore state errors
    }

    return '/auth/login';
  }

  private async exchangeCodeForToken(code: string): Promise<string> {
    const creds = await this.getCredentialsOrThrow();
    const tokenUrl = new URL(
      'https://graph.facebook.com/v19.0/oauth/access_token',
    );
    tokenUrl.searchParams.set('client_id', creds.clientId);
    tokenUrl.searchParams.set('redirect_uri', creds.redirectUri);
    tokenUrl.searchParams.set('client_secret', creds.clientSecret);
    tokenUrl.searchParams.set('code', code);

    const res = await fetch(tokenUrl);
    if (!res.ok) {
      throw new BadRequestException('failed to exchange Facebook code');
    }

    const data = (await res.json()) as FacebookTokenResponse;
    if (!data.access_token) {
      throw new BadRequestException('missing Facebook access token');
    }

    return data.access_token;
  }

  private async fetchProfile(accessToken: string): Promise<FacebookGraphUser> {
    const profileUrl = new URL('https://graph.facebook.com/v19.0/me');
    profileUrl.searchParams.set(
      'fields',
      'id,email,first_name,last_name,picture',
    );
    profileUrl.searchParams.set('access_token', accessToken);

    const res = await fetch(profileUrl);
    if (!res.ok) {
      throw new BadRequestException('failed to fetch Facebook profile');
    }

    return (await res.json()) as FacebookGraphUser;
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
        'facebook',
      );
    if (!creds?.clientId || !creds.clientSecret || !creds.redirectUri) {
      throw new ServiceUnavailableException('Facebook OAuth not configured');
    }
    return {
      clientId: creds.clientId,
      clientSecret: creds.clientSecret,
      redirectUri: creds.redirectUri,
    };
  }
}
