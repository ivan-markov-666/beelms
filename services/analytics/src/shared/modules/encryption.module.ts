import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EncryptionService } from '../services/encryption.service';

/**
 * Encryption Module
 *
 * Модул, който предоставя услуги за криптиране и декриптиране на чувствителни данни.
 */
@Module({
  imports: [ConfigModule],
  providers: [EncryptionService],
  exports: [EncryptionService],
})
export class EncryptionModule {}
