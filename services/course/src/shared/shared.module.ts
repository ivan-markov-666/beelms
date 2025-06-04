import { Global, Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { NotificationService } from './services/notification.service';
import { CsrfMiddleware } from './middleware/csrf.middleware';
import { RateLimitMiddleware } from './middleware/rate-limit.middleware';
import { ValidationExceptionFilter } from './filters/validation.filter';
import { SecureFileUploadService } from './services/secure-file-upload.service';

@Global()
@Module({
  imports: [EventEmitterModule.forRoot()],
  providers: [
    NotificationService,
    CsrfMiddleware,
    RateLimitMiddleware,
    ValidationExceptionFilter,
    SecureFileUploadService,
  ],
  exports: [
    NotificationService,
    CsrfMiddleware,
    RateLimitMiddleware,
    ValidationExceptionFilter,
    SecureFileUploadService,
  ],
})
export class SharedModule {}
