import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ThrottlerGuard as NestThrottlerGuard, ThrottlerModuleOptions, ThrottlerOptions, ThrottlerStorage } from '@nestjs/throttler';

@Injectable()
export class CustomThrottlerGuard extends NestThrottlerGuard {
  constructor(
    protected options: ThrottlerModuleOptions,
    protected storageService: ThrottlerStorage,
    protected reflector: Reflector
  ) {
    super(options, storageService, reflector);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Възможност за пропускане на Rate Limiting за определени маршрути
    const skipThrottle = this.reflector.getAllAndOverride<boolean>('skipThrottle', [
      context.getHandler(),
      context.getClass()
    ]);

    if (skipThrottle) {
      return true;
    }
    
    // In newer versions of ThrottlerGuard, we need a different approach for custom per-route settings
    // We'll implement this in the getTrackers method
    
    return super.canActivate(context);
  }

  // Override getTrackers to apply custom per-route throttle settings
  protected getTrackers(context: ExecutionContext): ThrottlerOptions[] {
    const throttleOptions = this.reflector.getAllAndOverride<{ ttl: number; limit: number }>('throttle', [
      context.getHandler(),
      context.getClass()
    ]);
    
    if (throttleOptions) {
      // Return custom throttle settings for this route
      return [throttleOptions];
    }
    
    // Use default throttlers from the module options
    // The ThrottlerModuleOptions in v6+ has a throttlers array of ThrottlerOptions
    return (this.options as any).throttlers || [];
  }
}
