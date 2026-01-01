import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { OAuth2Client } from 'google-auth-library';
import { SocialOAuthStateService } from './social-oauth-state.service';

export interface GoogleProfile {
  email: string;
  emailVerified: boolean;
  givenName?: string;
  familyName?: string;
  picture?: string;
  redirectPath: string;
}

@Injectable()
export class GoogleOAuthService {
  private readonly client: OAuth2Client | null;
  private readonly clientId: string;
  private readonly frontendOrigin: string;
  private readonly configured: boolean;

  constructor(private readonly stateService: SocialOAuthStateService) {
    this.clientId = process.env.GOOGLE_CLIENT_ID ?? '';
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET ?? '';
    const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URL ?? '';
    this.frontendOrigin =
      process.env.FRONTEND_ORIGIN ?? 'http://localhost:3001';

    this.configured = Boolean(this.clientId && clientSecret && redirectUri);
    this.client = this.configured
      ? new OAuth2Client({
          clientId: this.clientId,
          clientSecret,
          redirectUri,
        })
      : null;
  }

  isConfigured(): boolean {
    return this.configured;
  }

  createAuthorizationUrl(redirectPath?: string): {
    url: string;
    state: string;
  } {
    const client = this.getClientOrThrow();
    const normalizedRedirectPath = this.normalizeRedirectPath(redirectPath);
    const state = this.stateService.createState({
      provider: 'google',
      redirectPath: normalizedRedirectPath,
    });

    const url = client.generateAuthUrl({
      scope: ['openid', 'email', 'profile'],
      access_type: 'offline',
      prompt: 'consent',
      state,
    });

    return { url, state };
  }

  async exchangeCodeForProfile(
    code: string,
    state: string,
  ): Promise<GoogleProfile> {
    const client = this.getClientOrThrow();
    const statePayload = this.stateService.verifyState(state);
    if (statePayload.provider !== 'google') {
      throw new BadRequestException('invalid oauth provider');
    }

    const { tokens } = await client.getToken(code);
    if (!tokens.id_token) {
      throw new BadRequestException('missing id token from Google');
    }

    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: this.clientId,
    });
    const payload = ticket.getPayload();

    if (!payload?.email) {
      throw new BadRequestException('Google account does not include email');
    }

    return {
      email: payload.email,
      emailVerified: Boolean(payload.email_verified),
      givenName: payload.given_name ?? undefined,
      familyName: payload.family_name ?? undefined,
      picture: payload.picture ?? undefined,
      redirectPath: statePayload.redirectPath,
    };
  }

  buildFrontendRedirectUrl(params: {
    provider: 'google';
    redirectPath: string;
    token?: string;
    error?: string;
  }): string {
    const target = new URL('/auth/social-callback', this.frontendOrigin);
    target.searchParams.set('provider', params.provider);
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
      if (payload.provider === 'google') {
        return this.normalizeRedirectPath(payload.redirectPath);
      }
    } catch {
      // ignore
    }

    return '/auth/login';
  }

  private getClientOrThrow(): OAuth2Client {
    if (!this.client || !this.configured) {
      throw new ServiceUnavailableException('Google OAuth not configured');
    }
    return this.client;
  }

  private normalizeRedirectPath(path?: string): string {
    if (!path || !path.startsWith('/')) {
      return '/wiki';
    }
    return path;
  }
}
