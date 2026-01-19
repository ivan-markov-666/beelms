import {
  Inject,
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { Backup } from './backup.entity';
import type { BackupStatus } from './backup.entity';
import { BackupsService } from './backups.service';
import type {
  BackupRetentionTimePeriod,
  InstanceBackupRetentionConfig,
} from '../settings/instance-config.entity';
import { InstanceConfig } from '../settings/instance-config.entity';
import { SettingsService } from '../settings/settings.service';

type Actor = {
  actorUserId: string | null;
  actorEmail: string | null;
};

function normalizeRetentionPeriod(value: unknown): BackupRetentionTimePeriod {
  const allowed: BackupRetentionTimePeriod[] = [
    '1_minute',
    'weekly',
    'monthly',
    '2_months',
    '3_months',
    '6_months',
    'yearly',
    'never',
  ];
  if (
    typeof value === 'string' &&
    allowed.includes(value as BackupRetentionTimePeriod)
  ) {
    return value as BackupRetentionTimePeriod;
  }
  return 'monthly';
}

function normalizeKeepLast(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return 100;
  }
  const n = Math.trunc(value);
  if (n <= 0) {
    return 100;
  }
  return Math.min(n, 1_000_000);
}

function subtractMonths(dt: Date, months: number): Date {
  const d = new Date(dt);
  const y = d.getFullYear();
  const m = d.getMonth();
  d.setFullYear(y, m - months, d.getDate());
  return d;
}

function getCutoffDate(period: BackupRetentionTimePeriod): Date | null {
  const now = new Date();
  if (period === '1_minute') {
    return new Date(now.getTime() - 60 * 1000);
  }
  if (period === 'never') return null;
  if (period === 'weekly') {
    return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }
  if (period === 'monthly') {
    return subtractMonths(now, 1);
  }
  if (period === '2_months') {
    return subtractMonths(now, 2);
  }
  if (period === '3_months') {
    return subtractMonths(now, 3);
  }
  if (period === '6_months') {
    return subtractMonths(now, 6);
  }
  if (period === 'yearly') {
    return subtractMonths(now, 12);
  }
  return subtractMonths(now, 1);
}

@Injectable()
export class BackupRetentionService implements OnModuleInit, OnModuleDestroy {
  private timer: NodeJS.Timeout | null = null;
  // Run retention checks every minute so the 1-minute testing period behaves as expected.
  private readonly intervalMs = 60 * 1000;
  private readonly lockKey = 780_002;

  constructor(
    @InjectRepository(Backup)
    private readonly backupsRepo: Repository<Backup>,
    @InjectRepository(InstanceConfig)
    private readonly instanceConfigRepo: Repository<InstanceConfig>,
    private readonly settingsService: SettingsService,
    @Inject(forwardRef(() => BackupsService))
    private readonly backupsService: BackupsService,
  ) {}

  onModuleInit(): void {
    if (process.env.NODE_ENV === 'test') {
      return;
    }

    this.timer = setInterval(() => {
      void this.tick();
    }, this.intervalMs);

    void this.tick();
  }

  onModuleDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  async runOnce(): Promise<void> {
    await this.tick();
  }

  private async tick(): Promise<void> {
    const cfg = await this.settingsService.getOrCreateInstanceConfig();
    const retention: InstanceBackupRetentionConfig | null =
      cfg.backupConfig?.retention ?? null;

    const timeEnabled = retention?.time?.enabled === true;
    const timePeriod = normalizeRetentionPeriod(
      retention?.time?.period ?? 'monthly',
    );
    const cutoff = timeEnabled ? getCutoffDate(timePeriod) : null;

    const countEnabled = retention?.count?.enabled === true;
    const keepLast = normalizeKeepLast(retention?.count?.keepLast ?? 100);

    if (!timeEnabled && !countEnabled) {
      return;
    }

    const lockedRows: unknown = await this.instanceConfigRepo.query(
      'SELECT pg_try_advisory_lock($1) AS locked',
      [this.lockKey],
    );

    const locked =
      Array.isArray(lockedRows) &&
      (lockedRows[0] as { locked?: boolean } | undefined)?.locked === true;
    if (!locked) {
      return;
    }

    try {
      const whereActive = {
        status: Not<BackupStatus>('deleted'),
      };
      const totalCount = await this.backupsRepo.count({ where: whereActive });

      const hasCountRule = countEnabled && keepLast > 0;
      const hasCountDeletions = hasCountRule && keepLast < totalCount;

      let protectedIds: string[] = [];
      if (hasCountRule) {
        const cap = Math.min(keepLast, 5000);
        const newest = await this.backupsRepo.find({
          where: whereActive,
          order: { createdAt: 'DESC' },
          take: cap,
          select: { id: true },
        });
        protectedIds = newest.map((b) => b.id);
      }

      const candidates = new Set<string>();

      if (hasCountDeletions) {
        const pageSize = 500;
        let skip = keepLast;
        for (;;) {
          const page = await this.backupsRepo.find({
            where: whereActive,
            order: { createdAt: 'DESC' },
            skip,
            take: pageSize,
            select: { id: true },
          });
          if (page.length === 0) break;
          for (const b of page) {
            candidates.add(b.id);
          }
          skip += page.length;
          if (page.length < pageSize) break;
        }
      }

      if (timeEnabled && cutoff) {
        const qb = this.backupsRepo
          .createQueryBuilder('b')
          .select(['b.id'])
          .where('b.status <> :deleted', { deleted: 'deleted' })
          .andWhere('b.createdAt < :cutoff', { cutoff });

        if (protectedIds.length > 0) {
          qb.andWhere('b.id NOT IN (:...protectedIds)', { protectedIds });
        }

        const rows = await qb.getRawMany<{ b_id: string }>();
        for (const r of rows) {
          if (typeof r?.b_id === 'string') {
            candidates.add(r.b_id);
          }
        }
      }

      const actor: Actor = { actorUserId: null, actorEmail: null };
      for (const id of candidates) {
        try {
          await this.backupsService.deleteBackup(id, actor, 'retention');
        } catch {
          // ignore
        }
      }
    } finally {
      await this.instanceConfigRepo.query('SELECT pg_advisory_unlock($1)', [
        this.lockKey,
      ]);
    }
  }
}
