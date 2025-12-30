import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
  type Type,
  mixin,
} from '@nestjs/common';
import { SettingsService } from './settings.service';
import type { InstanceFeatures } from './instance-config.entity';

export function FeatureEnabledGuard(
  feature: keyof InstanceFeatures,
): Type<CanActivate> {
  @Injectable()
  class FeatureEnabledGuardMixin implements CanActivate {
    constructor(private readonly settingsService: SettingsService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
      void context;
      const cfg = await this.settingsService.getOrCreateInstanceConfig();
      const enabled = cfg.features?.[feature] !== false;

      if (!enabled) {
        throw new NotFoundException('Feature disabled');
      }

      return true;
    }
  }

  return mixin(FeatureEnabledGuardMixin);
}
