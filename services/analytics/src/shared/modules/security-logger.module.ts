import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SecurityLoggerService } from '../services/security-logger.service';

/**
 * Security Logger Module
 *
 * Модул, който предоставя разширени възможности за логване на събития,
 * свързани със сигурността
 */
@Global()
@Module({
  imports: [ConfigModule],
  providers: [SecurityLoggerService],
  exports: [SecurityLoggerService],
})
export class SecurityLoggerModule {}
