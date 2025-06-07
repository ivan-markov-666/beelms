import { Module, Global } from '@nestjs/common';
import { EncryptionService } from './services/encryption.service';
import { ConfigModule } from '@nestjs/config';

/**
 * Модул за криптиране на чувствителни данни
 * Маркиран като @Global за да е достъпен навсякъде в приложението
 */
@Global()
@Module({
  imports: [ConfigModule],
  providers: [EncryptionService],
  exports: [EncryptionService],
})
export class EncryptionModule {}
