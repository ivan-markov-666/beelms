import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { SocialOAuthStateService } from './social-oauth-state.service';

export interface GithubProfile {
  email: string;
  emailVerified: boolean;
  givenName?: string;
  familyName?: string;
  picture?: string;
  redirectPath: string;
}

type GithubTokenResponse = {
  access_token?: string;
  token_type?: string;
  scope?: string;
  error?: string;
  error_description?: string;
};

type GithubUserResponse = {
  id: number;
  login: string;
  email?: string;
  name?: string;
  avatar_url?: string;
};

type GithubEmailRecord = {
  email?: string;
  primary?: boolean;
  verified?: boolean;
  visibility?: string | null;
};

@Injectable()
export class GithubOAuthService {
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly redirectUri: string;
  private readonly frontendOrigin: string;
  private readonly configured: boolean;

  constructor(private readonly stateService: SocialOAuthStateService) {
    this.clientId = process.env.GITHUB_CLIENT_ID ?? '';
    this.clientSecret = process.env.GITHUB_CLIENT_SECRET ?? '';
    this.redirectUri = process.env.GITHUB_OAUTH_REDIRECT_URL ?? '';
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
      throw new ServiceUnavailableException('GitHub OAuth not configured');
    }

    const normalizedRedirectPath = this.normalizeRedirectPath(redirectPath);
    const state = this.stateService.createState({
      provider: 'github',
      redirectPath: normalizedRedirectPath,
    });

    const url = new URL('https://github.com/login/oauth/authorize');
    url.searchParams.set('client_id', this.clientId);
    url.searchParams.set('redirect_uri', this.redirectUri);
    url.searchParams.set('scope', 'read:user user:email');
    url.searchParams.set('allow_signup', 'true');
    url.searchParams.set('state', state);

    return { url: url.toString(), state };
  }

  async exchangeCodeForProfile(
    code: string,
    state: string,
  ): Promise<GithubProfile> {
    const statePayload = this.stateService.verifyState(state);
    if (statePayload.provider !== 'github') {
      throw new BadRequestException('invalid oauth provider');
    }

    const token = await this.exchangeCodeForToken(code);
    const [user, email] = await Promise.all([
      this.fetchGithubUser(token),
      this.fetchPrimaryEmail(token),
    ]);

    if (!email) {
      throw new BadRequestException('GitHub account does not expose email');
    }

    const [givenName, ...restName] = (user.name ?? '').trim().split(' ');
    const familyName = restName.length ? restName.join(' ') : undefined;

    return {
      email: email.toLowerCase(),
      emailVerified: true,
      givenName: givenName || undefined,
      familyName,
      picture: user.avatar_url ?? undefined,
      redirectPath: statePayload.redirectPath,
    };
  }

  buildFrontendRedirectUrl(params: {
    redirectPath: string;
    token?: string;
    error?: string;
  }): string {
    const target = new URL('/auth/social-callback', this.frontendOrigin);
    target.searchParams.set('provider', 'github');
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
      if (payload.provider === 'github') {
        return this.normalizeRedirectPath(payload.redirectPath);
      }
    } catch {
      // ignore
    }

    return '/auth/login';
  }

  private async exchangeCodeForToken(code: string): Promise<string> {
    if (!this.configured) {
      throw new ServiceUnavailableException('GitHub OAuth not configured');
    }

    const body = new URLSearchParams({
      client_id: this.clientId,
      client_secret: this.clientSecret,
      redirect_uri: this.redirectUri,
      code,
    });

    const res = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
      },
      body,
    });

    if (!res.ok) {
      throw new BadRequestException('failed to exchange GitHub code');
    }

    const data = (await res.json()) as GithubTokenResponse;
    if (!data.access_token) {
      throw new BadRequestException('missing GitHub access token');
    }

    return data.access_token;
  }

  private async fetchGithubUser(
    accessToken: string,
  ): Promise<GithubUserResponse> {
    const res = await fetch('https://api.github.com/user', {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${accessToken}`,
        'User-Agent': 'beelms-app',
      },
    });

    if (!res.ok) {
      throw new BadRequestException('failed to fetch GitHub profile');
    }

    return (await res.json()) as GithubUserResponse;
  }

  private async fetchPrimaryEmail(accessToken: string): Promise<string | null> {
    const res = await fetch('https://api.github.com/user/emails', {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${accessToken}`,
        'User-Agent': 'beelms-app',
      },
    });

    if (!res.ok) {
      throw new BadRequestException('failed to fetch GitHub emails');
    }

    const emails = (await res.json()) as GithubEmailRecord[];
    const primary = emails.find((record) => record.primary && record.verified);
    if (primary?.email) {
      return primary.email;
    }

    const anyVerified = emails.find(
      (record) => record.verified && record.email,
    );
    return anyVerified?.email ?? null;
  }

  private normalizeRedirectPath(path?: string): string {
    if (!path || !path.startsWith('/')) {
      return '/wiki';
    }
    return path;
  }
}
