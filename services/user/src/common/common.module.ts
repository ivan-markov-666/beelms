import { Module, Global, Logger } from '@nestjs/common';
import { SecurityMonitorService } from './services/security-monitor.service';
import { CsrfMiddleware } from './middleware/csrf.middleware';
import { IpBlockGuard } from './guards/ip-block.guard';

@Global()
@Module({
  providers: [SecurityMonitorService, CsrfMiddleware, Logger, IpBlockGuard],
  exports: [SecurityMonitorService, CsrfMiddleware, Logger, IpBlockGuard],
})
export class CommonModule {}
