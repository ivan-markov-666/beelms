import { Test } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { validationSchema } from '../src/config/validation';

/**
 * Unit tests verifying configuration validation logic.
 * The NestJS application should fail fast if required environment variables are missing or invalid.
 */
describe('Environment configuration validation', () => {
  const ORIGINAL_ENV = { ...process.env };

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV }; // restore
  });

  it('throws when DATABASE_URL is missing', async () => {
    process.env = { ...ORIGINAL_ENV }; // clone
    delete process.env.DATABASE_URL;

    await expect(
      Test.createTestingModule({
        imports: [
          ConfigModule.forRoot({
            isGlobal: true,
            validationSchema,
          }),
        ],
      }).compile(),
    ).rejects.toThrow();
  });

  it('throws when DATABASE_URL is not a valid URI', async () => {
    process.env = { ...ORIGINAL_ENV, DATABASE_URL: 'not-a-valid-uri' };

    await expect(
      Test.createTestingModule({
        imports: [
          ConfigModule.forRoot({
            isGlobal: true,
            validationSchema,
          }),
        ],
      }).compile(),
    ).rejects.toThrow();
  });
});
