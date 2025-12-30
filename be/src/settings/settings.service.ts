import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  InstanceBranding,
  InstanceConfig,
  InstanceFeatures,
  InstanceLanguages,
} from './instance-config.entity';
import type { AdminUpdateInstanceSettingsDto } from './dto/admin-update-instance-settings.dto';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(InstanceConfig)
    private readonly instanceConfigRepo: Repository<InstanceConfig>,
  ) {}

  private buildDefaultBranding(): InstanceBranding {
    return {
      appName: 'BeeLMS',
      logoUrl: null,
      primaryColor: null,
    };
  }

  private buildDefaultFeatures(): InstanceFeatures {
    return {
      wikiPublic: true,
      courses: true,
      auth: true,
      paidCourses: true,
      gdprLegal: true,
      infraRedis: false,
      infraRabbitmq: false,
      infraMonitoring: true,
      infraErrorTracking: false,
    };
  }

  private buildDefaultLanguages(): InstanceLanguages {
    return {
      supported: ['bg', 'en', 'de'],
      default: 'bg',
    };
  }

  async getOrCreateInstanceConfig(): Promise<InstanceConfig> {
    const [existing] = await this.instanceConfigRepo.find({
      order: { createdAt: 'ASC' },
      take: 1,
    });

    if (existing) {
      return existing;
    }

    const created = this.instanceConfigRepo.create({
      branding: this.buildDefaultBranding(),
      features: this.buildDefaultFeatures(),
      languages: this.buildDefaultLanguages(),
    });

    return this.instanceConfigRepo.save(created);
  }

  async updateInstanceConfig(
    dto: AdminUpdateInstanceSettingsDto,
  ): Promise<InstanceConfig> {
    const cfg = await this.getOrCreateInstanceConfig();

    const branding = dto.branding
      ? {
          ...cfg.branding,
          ...dto.branding,
        }
      : cfg.branding;

    const features = dto.features
      ? {
          ...cfg.features,
          ...dto.features,
        }
      : cfg.features;

    const languages = dto.languages
      ? {
          ...cfg.languages,
          ...dto.languages,
        }
      : cfg.languages;

    if (!Array.isArray(languages.supported) || languages.supported.length < 1) {
      throw new BadRequestException(
        'languages.supported must contain at least 1 language',
      );
    }

    if (!languages.supported.includes(languages.default)) {
      throw new BadRequestException(
        'languages.default must be included in languages.supported',
      );
    }

    cfg.branding = branding;
    cfg.features = features;
    cfg.languages = languages;

    return this.instanceConfigRepo.save(cfg);
  }
}
