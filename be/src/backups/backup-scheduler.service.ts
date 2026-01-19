import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { InstanceBackupScheduleConfig } from '../settings/instance-config.entity';
import { InstanceConfig } from '../settings/instance-config.entity';
import { SettingsService } from '../settings/settings.service';
import { BackupsService } from './backups.service';

function parseTimeOfDay(value: string): {
  hour: number;
  minute: number;
} | null {
  const m = (value ?? '').trim().match(/^([01]\d|2[0-3]):([0-5]\d)$/);
  if (!m) return null;
  return { hour: Number(m[1]), minute: Number(m[2]) };
}

function normalizeScheduleTimes(
  schedule: InstanceBackupScheduleConfig,
): string[] {
  const raw =
    schedule.timesOfDay && Array.isArray(schedule.timesOfDay)
      ? schedule.timesOfDay
      : schedule.timeOfDay
        ? [schedule.timeOfDay]
        : [];

  const times = raw
    .map((t) => (typeof t === 'string' ? t.trim() : ''))
    .filter((t) => /^([01]\d|2[0-3]):[0-5]\d$/.test(t));

  return Array.from(new Set(times)).sort();
}

function getZonedParts(timeZone: string): {
  yyyyMmDd: string;
  hour: number;
  minute: number;
} {
  const dt = new Date();
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const parts = fmt.formatToParts(dt);
  const byType: Record<string, string> = {};
  for (const p of parts) {
    if (p.type !== 'literal') {
      byType[p.type] = p.value;
    }
  }

  const year = byType.year;
  const month = byType.month;
  const day = byType.day;
  const hour = Number(byType.hour ?? '0');
  const minute = Number(byType.minute ?? '0');

  return {
    yyyyMmDd: `${year}-${month}-${day}`,
    hour,
    minute,
  };
}

function toYyyyMmDd(iso: string, timeZone: string): string | null {
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return null;

  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const parts = fmt.formatToParts(dt);
  const byType: Record<string, string> = {};
  for (const p of parts) {
    if (p.type !== 'literal') {
      byType[p.type] = p.value;
    }
  }

  const year = byType.year;
  const month = byType.month;
  const day = byType.day;

  if (!year || !month || !day) return null;
  return `${year}-${month}-${day}`;
}

@Injectable()
export class BackupSchedulerService implements OnModuleInit, OnModuleDestroy {
  private timer: NodeJS.Timeout | null = null;
  private readonly intervalMs = 30_000;

  constructor(
    @InjectRepository(InstanceConfig)
    private readonly instanceConfigRepo: Repository<InstanceConfig>,
    private readonly settingsService: SettingsService,
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

  private async tick(): Promise<void> {
    const cfg = await this.settingsService.getOrCreateInstanceConfig();
    const schedule = cfg.backupConfig?.schedule ?? null;

    if (!schedule || schedule.enabled !== true) {
      return;
    }

    const tz = (schedule.timezone ?? '').trim() || 'Europe/Sofia';
    const timesOfDay = normalizeScheduleTimes(schedule);
    if (timesOfDay.length === 0) {
      return;
    }

    let now: { yyyyMmDd: string; hour: number; minute: number };
    try {
      now = getZonedParts(tz);
    } catch {
      return;
    }

    const matchedTime = timesOfDay.find((t) => {
      const parsed = parseTimeOfDay(t);
      return (
        !!parsed && now.hour === parsed.hour && now.minute === parsed.minute
      );
    });

    if (!matchedTime) {
      return;
    }

    const runKey = `${now.yyyyMmDd}|${matchedTime}`;

    if (
      typeof schedule.lastRunKey === 'string' &&
      schedule.lastRunKey === runKey
    ) {
      return;
    }

    const isLegacySingleTime =
      !schedule.lastRunKey && (schedule.timesOfDay ?? null) === null;
    if (isLegacySingleTime) {
      const lastRunDay = schedule.lastRunAt
        ? toYyyyMmDd(schedule.lastRunAt, tz)
        : null;
      if (lastRunDay === now.yyyyMmDd) {
        return;
      }
    }

    const lockKey = 780_001;
    const lockedRows: unknown = await this.instanceConfigRepo.query(
      'SELECT pg_try_advisory_lock($1) AS locked',
      [lockKey],
    );

    const locked =
      Array.isArray(lockedRows) &&
      (lockedRows[0] as { locked?: boolean } | undefined)?.locked === true;
    if (!locked) {
      return;
    }

    try {
      const latest = await this.settingsService.getOrCreateInstanceConfig();
      const latestSchedule = latest.backupConfig?.schedule ?? null;
      const latestTimes = latestSchedule
        ? normalizeScheduleTimes(latestSchedule)
        : [];
      const latestMatched = latestTimes.includes(matchedTime);
      if (!latestMatched) {
        return;
      }

      if (
        typeof latestSchedule?.lastRunKey === 'string' &&
        latestSchedule.lastRunKey === runKey
      ) {
        return;
      }

      const job = this.backupsService.startCreateBackupJob({
        actorUserId: null,
        actorEmail: null,
        type: 'scheduled',
        encryptionPassword: latestSchedule?.encryptionPassword ?? null,
      });

      const nextSchedule: InstanceBackupScheduleConfig = {
        ...(latestSchedule ?? {}),
        enabled: true,
        timezone: tz,
        timeOfDay: latestTimes[0] ?? matchedTime,
        timesOfDay: latestTimes,
        lastRunAt: new Date().toISOString(),
        lastRunKey: runKey,
      };

      latest.backupConfig = {
        ...(latest.backupConfig ?? {}),
        schedule: nextSchedule,
      };

      await this.instanceConfigRepo.save(latest);

      void job;
    } finally {
      await this.instanceConfigRepo.query('SELECT pg_advisory_unlock($1)', [
        lockKey,
      ]);
    }
  }
}
