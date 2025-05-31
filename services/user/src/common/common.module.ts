import { Module, Global, Logger } from '@nestjs/common';
import { SecurityMonitorService } from './services/security-monitor.service';
import { CsrfMiddleware } from './middleware/csrf.middleware';

@Global()
@Module({
  providers: [SecurityMonitorService, CsrfMiddleware, Logger],
  exports: [SecurityMonitorService, CsrfMiddleware, Logger],
})
export class CommonModule {}
