import { Request } from 'express';

export enum SecurityEventType {
  MIDDLEWARE_INIT = 'MIDDLEWARE_INIT',
  XSS_ATTEMPT = 'XSS_ATTEMPT',
  SQL_INJECTION_ATTEMPT = 'SQL_INJECTION_ATTEMPT',
  BRUTE_FORCE_ATTEMPT = 'BRUTE_FORCE_ATTEMPT',
  CSRF_VALIDATION_FAILED = 'CSRF_VALIDATION_FAILED',
  AUTH_FAILURE = 'AUTH_FAILURE',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
}

export interface SecurityEvent {
  type: SecurityEventType;
  timestamp: Date;
  ipAddress?: string;
  userId?: string;
  endpoint?: string;
  metadata?: Record<string, unknown>;
  userAgent?: string;
  requestId?: string;
}

export interface SecurityMonitorService {
  registerEvent(event: SecurityEvent): void;
  logSecurityEvent(event: SecurityEvent): void;
  getRecentEvents(limit?: number): SecurityEvent[];
  getEventsByType(type: SecurityEventType, limit?: number): SecurityEvent[];
  getEventsByIp(ipAddress: string, limit?: number): SecurityEvent[];
  getEventsByUserId(userId: string, limit?: number): SecurityEvent[];
  cleanupOldEvents(daysToKeep?: number): Promise<number>;
  isIpBlocked(ipAddress: string): Promise<boolean>;
  blockIp(
    ipAddress: string,
    reason: string,
    durationHours?: number,
  ): Promise<void>;
  unblockIp(ipAddress: string): Promise<void>;
  getBlockedIps(): Promise<
    Array<{ ip: string; reason: string; blockedUntil: Date }>
  >;
  extractRequestInfo(req: Request): {
    ipAddress: string;
    userAgent: string;
    userId?: string;
    endpoint: string;
  };
}
