import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { SocialOAuthStateService } from './social-oauth-state.service';

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
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly redirectUri: string;
  private readonly frontendOrigin: string;
  private readonly configured: boolean;

  constructor(private readonly stateService: SocialOAuthStateService) {
    this.clientId = process.env.LINKEDIN_CLIENT_ID ?? '';
    this.clientSecret = process.env.LINKEDIN_CLIENT_SECRET ?? '';
    this.redirectUri = process.env.LINKEDIN_OAUTH_REDIRECT_URL ?? '';
    this.frontendOrigin =
      process.env.FRONTEND_ORIGIN ?? 'http://localhost:3001';

    this.configured = Boolean(
      this.clientId && this.clientSecret && this.redirectUri,
    );
  }

  isConfigured(): boolean {
    return this.configured;
  }

  createAuthorizationUrl(redirectPath?: string): {
    url: string;
    state: string;
  } {
    if (!this.configured) {
      throw new ServiceUnavailableException('LinkedIn OAuth not configured');
    }

    const normalizedRedirectPath = this.normalizeRedirectPath(redirectPath);
    const state = this.stateService.createState({
      provider: 'linkedin',
      redirectPath: normalizedRedirectPath,
    });

    const url = new URL('https://www.linkedin.com/oauth/v2/authorization');
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('client_id', this.clientId);
    url.searchParams.set('redirect_uri', this.redirectUri);
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
    if (!this.configured) {
      throw new ServiceUnavailableException('LinkedIn OAuth not configured');
    }

    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: this.redirectUri,
      client_id: this.clientId,
      client_secret: this.clientSecret,
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
}
