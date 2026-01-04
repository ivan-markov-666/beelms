import { MigrationInterface, QueryRunner } from 'typeorm';

type ProviderEnvKeys = {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
};

const PROVIDER_ENV_MAP: Record<string, ProviderEnvKeys> = {
  google: {
    clientId: 'GOOGLE_CLIENT_ID',
    clientSecret: 'GOOGLE_CLIENT_SECRET',
    redirectUri: 'GOOGLE_OAUTH_REDIRECT_URL',
  },
  facebook: {
    clientId: 'FACEBOOK_APP_ID',
    clientSecret: 'FACEBOOK_APP_SECRET',
    redirectUri: 'FACEBOOK_OAUTH_REDIRECT_URL',
  },
  github: {
    clientId: 'GITHUB_CLIENT_ID',
    clientSecret: 'GITHUB_CLIENT_SECRET',
    redirectUri: 'GITHUB_OAUTH_REDIRECT_URL',
  },
  linkedin: {
    clientId: 'LINKEDIN_CLIENT_ID',
    clientSecret: 'LINKEDIN_CLIENT_SECRET',
    redirectUri: 'LINKEDIN_OAUTH_REDIRECT_URL',
  },
};

export class AddSocialCredentialsToInstanceConfig1767800000000
  implements MigrationInterface
{
  name = 'AddSocialCredentialsToInstanceConfig1767800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "instance_config" ADD COLUMN "social_credentials" jsonb',
    );

    const initialCredentials = this.buildInitialCredentialsFromEnv();
    if (initialCredentials) {
      await queryRunner.query(
        `
        UPDATE "instance_config"
        SET "social_credentials" = $1
        WHERE "social_credentials" IS NULL
      `,
        [initialCredentials],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "instance_config" DROP COLUMN IF EXISTS "social_credentials"',
    );
  }

  private buildInitialCredentialsFromEnv(): string | null {
    const entries: Record<string, Record<string, string | null>> = {};

    for (const [provider, envKeys] of Object.entries(PROVIDER_ENV_MAP)) {
      const clientId = process.env[envKeys.clientId] ?? null;
      const clientSecret = process.env[envKeys.clientSecret] ?? null;
      const redirectUri = process.env[envKeys.redirectUri] ?? null;

      if (clientId || clientSecret || redirectUri) {
        entries[provider] = {
          clientId,
          clientSecret,
          redirectUri,
        };
      }
    }

    if (Object.keys(entries).length === 0) {
      return null;
    }

    return JSON.stringify(entries);
  }
}
