import {
  BadRequestException,
  HttpStatus,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { SocialProviderName } from './instance-config.entity';
import { SettingsService } from './settings.service';

export type SocialProviderTestResult = {
  provider: SocialProviderName;
  ok: true;
  checkedAt: string;
  latencyMs: number;
  httpStatus: number;
  endpoint: string;
};

type CompleteProviderCredentials = {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
};

type ProbeRequest = {
  url: string;
  init?: Parameters<typeof fetch>[1];
};

type FetchResponse = Awaited<ReturnType<typeof fetch>>;

@Injectable()
export class SocialProviderDiagnosticsService {
  constructor(private readonly settingsService: SettingsService) {}

  async testConnection(
    provider: SocialProviderName,
  ): Promise<SocialProviderTestResult> {
    const creds =
      await this.settingsService.getEffectiveSocialProviderCredentials(
        provider,
      );

    if (!creds?.clientId || !creds.clientSecret || !creds.redirectUri) {
      throw new BadRequestException(
        `Липсва Client ID/secret или Redirect URL за ${provider}.`,
      );
    }

    const probe = this.buildProbeRequest(provider, {
      clientId: creds.clientId,
      clientSecret: creds.clientSecret,
      redirectUri: creds.redirectUri,
    });

    const startedAt = Date.now();

    let response: FetchResponse;
    try {
      response = await fetch(probe.url, {
        redirect: 'manual',
        ...(probe.init ?? {}),
      });
    } catch (error) {
      throw new ServiceUnavailableException({
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
        message: `Неуспешна връзка към ${provider}`,
        details: error instanceof Error ? error.message : String(error),
      });
    }

    const latencyMs = Date.now() - startedAt;

    if (response.status >= 400) {
      const rawBody = await this.safeReadBody(response);
      const parsedBody = this.tryParseJson(rawBody);
      throw new ServiceUnavailableException({
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
        message: `Endpoint отговори с статус ${response.status}`,
        details: parsedBody ?? rawBody,
      });
    }

    return {
      provider,
      ok: true,
      checkedAt: new Date().toISOString(),
      latencyMs,
      httpStatus: response.status,
      endpoint: probe.url,
    };
  }

  private async safeReadBody(response: FetchResponse): Promise<string> {
    try {
      const text = await response.text();
      return text.length > 0 ? text : 'без съдържание';
    } catch (error) {
      return error instanceof Error ? error.message : 'неизвестна грешка';
    }
  }

  private tryParseJson(
    body: string,
  ): Record<string, unknown> | unknown[] | null {
    if (!body) {
      return null;
    }
    try {
      const parsed: unknown = JSON.parse(body);
      if (parsed && typeof parsed === 'object') {
        return parsed as Record<string, unknown> | unknown[];
      }
      return null;
    } catch {
      return null;
    }
  }

  private buildProbeRequest(
    provider: SocialProviderName,
    creds: CompleteProviderCredentials,
  ): ProbeRequest {
    switch (provider) {
      case 'google':
        return {
          url: 'https://accounts.google.com/.well-known/openid-configuration',
        };
      case 'facebook': {
        const params = new URLSearchParams();
        params.set('client_id', creds.clientId);
        params.set('client_secret', creds.clientSecret);
        params.set('grant_type', 'client_credentials');
        return {
          url: 'https://graph.facebook.com/v19.0/oauth/access_token',
          init: {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params.toString(),
          },
        };
      }
      case 'github':
        return {
          url: 'https://api.github.com/meta',
          init: {
            headers: {
              'User-Agent': 'BeeLMS-Diagnostics',
              Accept: 'application/json',
            },
          },
        };
      case 'linkedin':
        return {
          url: 'https://www.linkedin.com/oauth/.well-known/openid-configuration',
        };
    }

    const exhaustiveCheck: never = provider;
    throw new BadRequestException(
      `Unsupported provider: ${String(exhaustiveCheck)}`,
    );
  }
}
