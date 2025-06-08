import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Logger } from '@nestjs/common';
import { Request } from 'express';
import { Reflector } from '@nestjs/core';
import { ThrottlerModuleOptions } from '@nestjs/throttler';
import { ThrottlerStorage } from '@nestjs/throttler';

/**
 * Персонализиран ThrottlerGuard за Rate Limiting с поддръжка на SkipThrottle декоратор
 */
@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  private readonly logger = new Logger(CustomThrottlerGuard.name);

  constructor(
    options: ThrottlerModuleOptions,
    storageService: ThrottlerStorage,
    reflector: Reflector,
  ) {
    super(options, storageService, reflector);
  }

  /**
   * Проверява дали даден ендпойнт трябва да бъде пропуснат от Rate Limiting
   * В базовия клас това се постига с @SkipThrottle() декоратор
   */
  protected shouldSkip(context: ExecutionContext): Promise<boolean> {
    const skipThrottle = this.reflector.getAllAndOverride<boolean>(
      'skip-throttle',
      [context.getHandler(), context.getClass()],
    );

    // Логваме информация за пропуснатите заявки за дебъгване
    if (skipThrottle) {
      const req = context.switchToHttp().getRequest<Request>();
      const method = req.method || 'unknown';
      const url = req.url || 'unknown';

      this.logger.debug(
        `Skipping rate limiting for ${method} ${url} due to @SkipThrottle decorator`,
      );
    }

    return Promise.resolve(!!skipThrottle);
  }
}
