import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Reflector } from '@nestjs/core';
import { ThrottlerModuleOptions, ThrottlerStorage } from '@nestjs/throttler';
import {
  SecurityMonitorService,
  SecurityEventType,
} from '../services/security-monitor.service';
import { Request } from 'express';

// Разширяваме Request типа, за да включва user с id
interface RequestWithUser extends Request {
  user?: { id: string };
}

@Injectable()
export class AuthThrottlerGuard extends ThrottlerGuard {
  private currentThrottlerName = 'medium';
  // Нужно за интеграция с NestJS Throttler модула
  declare throttlerName: string;

  constructor(
    options: ThrottlerModuleOptions,
    storageService: ThrottlerStorage,
    reflector: Reflector,
    private readonly securityMonitor: SecurityMonitorService,
  ) {
    super(options, storageService, reflector);
  }
  /**
   * Специфична имплементация на throttler guard за защита на auth endpoints
   * Прилага по-строги ограничения за login и refresh-token endpoints
   */
  protected override async getTracker(
    req: Record<string, any>,
  ): Promise<string> {
    // Тъй като функцията трябва да е асинхронна, но в момента не изпълнява асинхронни операции
    await Promise.resolve();
    // Използваме IP адреса като основен идентификатор
    const ip = req.ip as string;
    // Връщаме IP адреса като tracker
    return ip;
  }

  /**
   * Метод, който се изпълнява при всяка заявка, и определя дали
   * тя е позволена или трябва да бъде блокирана.
   */
  public override async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    // Получаваме HTTP заявката
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const path = request.path;

    try {
      // Използваме подходящия throttler профил според пътя на заявката
      if (
        path.includes('/auth/login') ||
        path.includes('/auth/refresh-token')
      ) {
        this.currentThrottlerName = 'short';
        this.throttlerName = 'short';
      } else {
        this.currentThrottlerName = 'medium';
        this.throttlerName = 'medium';
      }

      // Прилагаме проверката за rate limiting
      return await super.canActivate(context);
    } catch (error) {
      // Заявката е ограничена, регистрираме security събитие
      const typedError = error as Error;
      this.securityMonitor.registerEvent({
        type: SecurityEventType.RATE_LIMIT_EXCEEDED,
        timestamp: new Date(),
        ipAddress: request.ip || 'unknown',
        userId: request.user?.id,
        endpoint: path,
        metadata: {
          userAgent: request.headers?.['user-agent'],
          throttlerName: this.currentThrottlerName,
          errorMessage: typedError.message,
        },
      });

      // Заявката е ограничена, предаваме грешката нагоре
      throw error;
    }
  }
}
