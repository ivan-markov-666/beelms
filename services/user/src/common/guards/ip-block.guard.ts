import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Logger,
} from '@nestjs/common';
import {
  SecurityMonitorService,
  SecurityEventType,
} from '../services/security-monitor.service';
import { Request } from 'express';

/**
 * Guard for IP blocking
 * Blocks IPs that have performed suspicious activities
 */
@Injectable()
export class IpBlockGuard implements CanActivate {
  private readonly logger = new Logger(IpBlockGuard.name);
  private readonly blockedIps = new Map<string, Date>();
  private readonly BLOCK_DURATION_MS = 30 * 60 * 1000; // 30 minutes

  constructor(private readonly securityMonitor: SecurityMonitorService) {
    // Clean up expired blocks periodically
    setInterval(() => this.cleanupExpiredBlocks(), 5 * 60 * 1000); // Every 5 minutes
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const ip = request.ip || '0.0.0.0'; // Default IP if not available

    // Check if the IP is blocked
    const blockedUntil = this.blockedIps.get(ip);
    if (blockedUntil && blockedUntil > new Date()) {
      this.logger.warn(`Blocked request from banned IP: ${ip}`);
      // Register the attempt as a security event
      this.securityMonitor.registerEvent({
        type: SecurityEventType.SUSPICIOUS_ACTIVITY,
        timestamp: new Date(),
        ipAddress: ip || 'unknown',
        endpoint: request.path || 'unknown',
        metadata: {
          reason: 'Request from blocked IP',
          remainingBlockTime:
            Math.ceil((blockedUntil.getTime() - Date.now()) / 1000 / 60) +
            ' minutes',
        },
      });
      return false;
    }

    // Check for suspicious activity
    const suspiciousEvents = this.securityMonitor.getEventsByTypeAndIp(
      SecurityEventType.SUSPICIOUS_ACTIVITY,
      ip,
      15 * 60 * 1000, // Last 15 minutes
    );

    // If there are multiple suspicious events, block the IP
    if (suspiciousEvents.length >= 3) {
      const blockUntil = new Date(Date.now() + this.BLOCK_DURATION_MS);
      this.blockedIps.set(ip, blockUntil);

      this.logger.warn(
        `Blocking IP ${ip} until ${blockUntil.toISOString()} due to suspicious activity`,
      );

      // Register the blocking as a security event
      this.securityMonitor.registerEvent({
        type: SecurityEventType.SUSPICIOUS_ACTIVITY,
        timestamp: new Date(),
        ipAddress: ip || 'unknown',
        endpoint: request.path || 'unknown',
        metadata: {
          reason: 'IP automatically blocked',
          suspiciousEventCount: suspiciousEvents.length,
          blockDuration: '30 minutes',
        },
      });

      return false;
    }

    return true;
  }

  /**
   * Clean up expired IP blocks
   */
  private cleanupExpiredBlocks(): void {
    const now = new Date();
    let count = 0;

    for (const [ip, until] of this.blockedIps.entries()) {
      if (until < now) {
        this.blockedIps.delete(ip);
        count++;
      }
    }

    if (count > 0) {
      this.logger.debug(`Cleaned up ${count} expired IP blocks`);
    }
  }
}
