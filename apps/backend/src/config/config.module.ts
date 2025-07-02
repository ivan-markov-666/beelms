import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validationSchema } from './validation';

/**
 * Global configuration module which:
 *  - Loads environment variables from the host process
 *  - Validates them against `validationSchema`
 *  - Makes the validated configuration available application-wide via Nest's ConfigService
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema,
    }),
  ],
})
export class AppConfigModule {}
