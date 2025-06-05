import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { SecurityMonitorService } from '../services/security-monitor.service';

/**
 * Guard для проверки дали даден IP адрес е блокиран
 */
@Injectable()
export class IpBlockGuard implements CanActivate {
  private readonly logger = new Logger(IpBlockGuard.name);

  constructor(private securityMonitor: SecurityMonitorService) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest<{ ip?: string }>();
    // Гарантируем, что всегда будет строковый IP-адрес
    const ipAddress: string = request.ip || '127.0.0.1';

    if (this.securityMonitor.isIpBlocked(ipAddress)) {
      this.logger.warn(`Blocked request from banned IP: ${ipAddress}`);
      return false;
    }

    return true;
  }
}
