import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { spawn } from 'child_process';
import { Not, Repository } from 'typeorm';
import type { Readable } from 'stream';
import {
  HeadBucketCommand,
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import {
  Backup,
  type BackupDeletionReason,
  type BackupEncryptionMeta,
  type BackupStatus,
  type BackupType,
} from './backup.entity';
import { BackupLog, type BackupLogAction } from './backup-log.entity';
import {
  InstanceBackupConfig,
  InstanceBackupRemoteS3Config,
  type BackupRetentionTimePeriod,
  type InstanceBackupRetentionConfig,
  type InstanceBackupScheduleConfig,
  InstanceConfig,
} from '../settings/instance-config.entity';
import { SettingsService } from '../settings/settings.service';
import {
  createDecryptionStream,
  decryptFileToPath,
  encryptFileInPlace,
} from './backup-encryption.util';
import { BackupRetentionService } from './backup-retention.service';

export type BackupJobType = 'create' | 'restore';

export type BackupJobStage =
  | 'starting'
  | 'preparing'
  | 'running'
  | 'hashing'
  | 'saving'
  | 'done'
  | 'failed';

export type BackupJobStatus = {
  id: string;
  type: BackupJobType;
  stage: BackupJobStage;
  percent: number;
  message: string;
  startedAt: string;
  finishedAt: string | null;
  error: string | null;
  backupId: string | null;
};

export type BackupListItemDto = {
  id: string;
  filename: string;
  type: BackupType;
  storage: string;
  sizeBytes: string;
  sha256: string;
  status: string;
  isEncrypted: boolean;
  errorMessage: string | null;
  createdByEmail: string | null;
  createdAt: string;
  deletedByEmail: string | null;
  deletedReason: BackupDeletionReason | null;
  deletedAt: string | null;
};

export type BackupDownloadDto = {
  filename: string;
  stream: Readable;
};

export type UploadedBackupFile = {
  mimetype?: string;
  size?: number;
  buffer?: Buffer;
  originalname?: string;
};

export type UploadBackupPreviewDto = {
  originalFilename: string;
  detectedDbVersion: string | null;
  detectedPgDumpVersion: string | null;
  detectedDumpedOn: string | null;
};

export type UploadBackupResponseDto = {
  backup: BackupListItemDto;
  preview: UploadBackupPreviewDto;
};

export type RemoteBackupConfigDto = {
  enabled: boolean;
  provider: 's3';
  s3: {
    accessKeyId: string | null;
    hasSecretAccessKey: boolean;
    bucket: string | null;
    region: string | null;
    prefix: string | null;
  };
};

export type BackupRetentionConfigDto = {
  time: {
    enabled: boolean;
    period: BackupRetentionTimePeriod;
  };
  count: {
    enabled: boolean;
    keepLast: number;
  };
};

export type UpdateBackupRetentionConfigDto = {
  time?: {
    enabled?: boolean;
    period?: BackupRetentionTimePeriod | null;
  } | null;
  count?: {
    enabled?: boolean;
    keepLast?: number | null;
  } | null;
};

export type UpdateRemoteBackupConfigDto = {
  enabled?: boolean;
  s3?: {
    accessKeyId?: string | null;
    secretAccessKey?: string | null;
    bucket?: string | null;
    region?: string | null;
    prefix?: string | null;
  };
};

export type BackupScheduleConfigDto = {
  enabled: boolean;
  timezone: string | null;
  timeOfDay: string | null;
  timesOfDay: string[];
  lastRunAt: string | null;
  hasEncryptionPassword: boolean;
};

export type UpdateBackupScheduleConfigDto = {
  enabled?: boolean;
  timezone?: string | null;
  timeOfDay?: string | null;
  timesOfDay?: string[] | null;
  encryptionPassword?: string | null;
};

function normalizeScheduleTime(value: unknown): string | null {
  if (value === null) return null;
  if (typeof value !== 'string') return undefined as unknown as string | null;
  const t = value.trim();
  if (!t) return null;
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(t)) {
    throw new BadRequestException('Invalid timeOfDay format (expected HH:MM)');
  }
  return t;
}

function normalizeScheduleTimes(value: unknown): string[] | null {
  if (value === null) return null;
  if (!Array.isArray(value)) {
    return undefined as unknown as string[] | null;
  }

  const times: string[] = [];
  for (const item of value) {
    const normalized = normalizeScheduleTime(item);
    if (normalized) {
      times.push(normalized);
    }
  }

  const uniqueSorted = Array.from(new Set(times)).sort();
  if (uniqueSorted.length !== times.length) {
    throw new BadRequestException('Duplicate schedule times are not allowed');
  }

  return uniqueSorted.length > 0 ? uniqueSorted : null;
}

function normalizeTimezone(value: unknown): string | null {
  if (value === null) return null;
  if (typeof value !== 'string') return undefined as unknown as string | null;
  const t = value.trim();
  if (!t) return null;
  return t.slice(0, 64);
}

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

type Actor = {
  actorUserId: string | null;
  actorEmail: string | null;
};

type CreateBackupOptions = Actor & {
  type: BackupType;
  encryptionPassword?: string | null;
};

function getMediaRoot(): string {
  const fromEnv = process.env.MEDIA_ROOT;
  if (fromEnv && fromEnv.trim().length > 0) {
    return fromEnv;
  }
  return path.join(process.cwd(), 'media');
}

function formatBackupFilename(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const yyyy = date.getFullYear();
  const mm = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const hh = pad(date.getHours());
  const min = pad(date.getMinutes());
  const ss = pad(date.getSeconds());
  return `backup_${yyyy}-${mm}-${dd}_${hh}-${min}-${ss}.sql`;
}

async function sha256File(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    stream.on('error', (err) => reject(err));
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
  });
}

async function statFileBytes(filePath: string): Promise<string> {
  const st = await fs.promises.stat(filePath);
  return String(st.size);
}

function buildBackupsDir(): string {
  return path.join(getMediaRoot(), 'backups');
}

function sanitizeBackupFilename(originalName: string): string {
  const ext = path.extname(originalName);
  const base = path.basename(originalName, ext);
  const safeBase = base
    .toLowerCase()
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
  const safeExt = ext.toLowerCase();
  return `${safeBase || 'backup'}${safeExt || '.sql'}`;
}

function parsePgDumpPreview(
  buffer: Buffer,
): Omit<UploadBackupPreviewDto, 'originalFilename'> {
  const head = buffer.subarray(0, Math.min(buffer.length, 64 * 1024));
  const text = head.toString('utf8');

  const dbMatch = text.match(/Dumped from database version\s+([^\n\r]+)/i);
  const pgDumpMatch = text.match(/Dumped by pg_dump version\s+([^\n\r]+)/i);
  const dumpedOnMatch = text.match(/Dumped on\s+([^\n\r]+)/i);

  return {
    detectedDbVersion: dbMatch?.[1]?.trim() ?? null,
    detectedPgDumpVersion: pgDumpMatch?.[1]?.trim() ?? null,
    detectedDumpedOn: dumpedOnMatch?.[1]?.trim() ?? null,
  };
}

function getDbEnv(): {
  host: string;
  port: string;
  user: string;
  password: string;
  db: string;
} {
  return {
    host: process.env.DB_HOST ?? 'localhost',
    port: String(process.env.DB_PORT ?? '5432'),
    user: process.env.DB_USER ?? 'beelms',
    password: process.env.DB_PASSWORD ?? 'beelms',
    db: process.env.DB_NAME ?? 'beelms',
  };
}

async function runProcess(
  command: string,
  args: string[],
  env?: NodeJS.ProcessEnv,
  options?: {
    stdoutFilePath?: string;
    stdinFilePath?: string;
  },
): Promise<{ exitCode: number; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      env: {
        ...process.env,
        ...(env ?? {}),
      },
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stderr = '';
    child.stderr.on('data', (buf: Buffer) => {
      stderr += buf.toString('utf8');
    });

    child.on('error', (err) => reject(err));

    if (options?.stdoutFilePath) {
      const out = fs.createWriteStream(options.stdoutFilePath, {
        flags: 'w',
      });
      child.stdout.pipe(out);
    } else {
      child.stdout.resume();
    }

    if (options?.stdinFilePath) {
      const input = fs.createReadStream(options.stdinFilePath);
      input.pipe(child.stdin);
    } else {
      child.stdin.end();
    }

    child.on('close', (code) => {
      resolve({ exitCode: code ?? 1, stderr });
    });
  });
}

@Injectable()
export class BackupsService {
  constructor(
    @InjectRepository(Backup)
    private readonly backupsRepo: Repository<Backup>,
    @InjectRepository(BackupLog)
    private readonly logsRepo: Repository<BackupLog>,
    @InjectRepository(InstanceConfig)
    private readonly instanceConfigRepo: Repository<InstanceConfig>,
    private readonly settingsService: SettingsService,
    @Inject(forwardRef(() => BackupRetentionService))
    private readonly backupRetentionService: BackupRetentionService,
  ) {}

  private readonly jobs = new Map<string, BackupJobStatus>();

  getJob(jobId: string): BackupJobStatus | null {
    return this.jobs.get(jobId) ?? null;
  }

  createJob(type: BackupJobType): BackupJobStatus {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const job: BackupJobStatus = {
      id,
      type,
      stage: 'starting',
      percent: 0,
      message: 'Starting',
      startedAt: new Date().toISOString(),
      finishedAt: null,
      error: null,
      backupId: null,
    };
    this.jobs.set(id, job);
    return job;
  }

  updateJob(jobId: string, patch: Partial<BackupJobStatus>): void {
    const prev = this.jobs.get(jobId);
    if (!prev) return;
    this.jobs.set(jobId, { ...prev, ...patch });
  }

  finishJob(jobId: string, patch?: Partial<BackupJobStatus>): void {
    this.updateJob(jobId, {
      finishedAt: new Date().toISOString(),
      ...patch,
    });
  }

  async listBackups(options?: {
    showDeleted?: boolean;
  }): Promise<BackupListItemDto[]> {
    const where = options?.showDeleted
      ? undefined
      : { status: Not<BackupStatus>('deleted') };
    const items = await this.backupsRepo.find({
      where,
      order: { createdAt: 'DESC' },
      take: 500,
    });

    return items.map((b) => this.toListItem(b));
  }

  async uploadBackup(
    file: UploadedBackupFile | undefined,
    actor: Actor,
    options?: { encryptionPassword?: string | null },
  ): Promise<UploadBackupResponseDto> {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const maxBytes = 512 * 1024 * 1024;
    const size =
      typeof file.size === 'number' ? file.size : file.buffer?.length;
    if (typeof size === 'number' && size <= 0) {
      throw new BadRequestException('File is empty');
    }
    if (typeof size === 'number' && size > maxBytes) {
      throw new BadRequestException('File is too large');
    }

    if (!file.buffer) {
      throw new BadRequestException('File buffer is missing');
    }

    const originalName = (file.originalname ?? '').trim() || 'backup.sql';
    const ext = path.extname(originalName).toLowerCase();
    if (ext !== '.sql') {
      throw new BadRequestException(
        'Unsupported file type. Only .sql is allowed',
      );
    }

    const allowedMimeTypes = new Set([
      'application/sql',
      'text/plain',
      'application/octet-stream',
    ]);
    if (file.mimetype && !allowedMimeTypes.has(file.mimetype)) {
      throw new BadRequestException('Unsupported file type');
    }

    const backupsDir = buildBackupsDir();
    await fs.promises.mkdir(backupsDir, { recursive: true });

    const safeName = sanitizeBackupFilename(originalName);
    const filename = `uploaded_${Date.now()}_${safeName}`;
    const filePath = path.join(backupsDir, filename);

    await fs.promises.writeFile(filePath, file.buffer);

    let encryptionMeta: BackupEncryptionMeta | null = null;
    const password = options?.encryptionPassword ?? null;
    if (password && password.trim().length > 0) {
      encryptionMeta = await encryptFileInPlace(filePath, password);
    }

    const [sha, sizeBytes] = await Promise.all([
      sha256File(filePath),
      statFileBytes(filePath),
    ]);

    const record = this.backupsRepo.create({
      filename,
      path: filePath,
      type: 'uploaded',
      storage: 'local',
      sizeBytes,
      sha256: sha,
      status: 'ready',
      encryptionMeta,
      errorMessage: null,
      createdByUserId: actor.actorUserId,
      createdByEmail: actor.actorEmail,
    });

    const saved = await this.backupsRepo.save(record);
    await this.logAction(saved.id, 'backup_created', actor, {
      filename,
      sizeBytes,
      source: 'upload',
    });

    await this.trySyncBackupToRemote(saved, actor);
    void this.backupRetentionService.runOnce();

    const previewMeta = parsePgDumpPreview(file.buffer);

    return {
      backup: this.toListItem(saved),
      preview: {
        originalFilename: originalName,
        ...previewMeta,
      },
    };
  }

  startCreateBackupJob(options: CreateBackupOptions): BackupJobStatus {
    const job = this.createJob('create');
    this.updateJob(job.id, {
      stage: 'preparing',
      percent: 5,
      message: 'Preparing backup',
    });
    void this.runCreateBackupJob(job.id, options);
    return job;
  }

  private async runCreateBackupJob(
    jobId: string,
    options: CreateBackupOptions,
  ): Promise<void> {
    try {
      const backupsDir = buildBackupsDir();
      await fs.promises.mkdir(backupsDir, { recursive: true });

      const now = new Date();
      const filename = formatBackupFilename(now);
      const filePath = path.join(backupsDir, filename);

      this.updateJob(jobId, {
        stage: 'running',
        percent: 25,
        message: 'Creating SQL dump',
      });

      const db = getDbEnv();
      const args = [
        '-h',
        db.host,
        '-p',
        db.port,
        '-U',
        db.user,
        '-d',
        db.db,
        '--format=plain',
        '--no-owner',
        '--no-privileges',
        '--clean',
        '--if-exists',
      ];

      const { exitCode, stderr } = await runProcess(
        'pg_dump',
        args,
        { PGPASSWORD: db.password },
        { stdoutFilePath: filePath },
      );

      if (exitCode !== 0) {
        await fs.promises.rm(filePath, { force: true });
        throw new Error(stderr || `pg_dump failed with code ${exitCode}`);
      }

      let encryptionMeta: BackupEncryptionMeta | null = null;
      const password = options.encryptionPassword ?? null;
      if (password && password.trim().length > 0) {
        this.updateJob(jobId, {
          stage: 'hashing',
          percent: 65,
          message: 'Encrypting backup',
        });
        encryptionMeta = await encryptFileInPlace(filePath, password);
      }

      this.updateJob(jobId, {
        stage: 'hashing',
        percent: 70,
        message: 'Computing checksum',
      });

      const [sha, sizeBytes] = await Promise.all([
        sha256File(filePath),
        statFileBytes(filePath),
      ]);

      this.updateJob(jobId, {
        stage: 'saving',
        percent: 90,
        message: 'Saving metadata',
      });

      const record = this.backupsRepo.create({
        filename,
        path: filePath,
        type: options.type,
        storage: 'local',
        sizeBytes,
        sha256: sha,
        status: 'ready',
        encryptionMeta,
        errorMessage: null,
        createdByUserId: options.actorUserId,
        createdByEmail: options.actorEmail,
      });

      const saved = await this.backupsRepo.save(record);
      await this.logAction(saved.id, 'backup_created', options, {
        filename,
        sizeBytes,
      });

      await this.trySyncBackupToRemote(saved, options);

      this.finishJob(jobId, {
        stage: 'done',
        percent: 100,
        message: 'Backup created',
        error: null,
        backupId: saved.id,
      });

      void this.backupRetentionService.runOnce();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Backup failed';
      this.finishJob(jobId, {
        stage: 'failed',
        percent: 100,
        message: 'Backup failed',
        error: message,
      });
    }
  }

  startRestoreBackupJob(
    id: string,
    actor: Actor,
    options?: { encryptionPassword?: string | null },
  ): BackupJobStatus {
    const job = this.createJob('restore');
    this.updateJob(job.id, {
      stage: 'preparing',
      percent: 5,
      message: 'Preparing restore',
    });
    void this.runRestoreBackupJob(job.id, id, actor, options);
    return job;
  }

  private async runRestoreBackupJob(
    jobId: string,
    backupId: string,
    actor: Actor,
    options?: { encryptionPassword?: string | null },
  ): Promise<void> {
    let backup: Backup | null = null;
    try {
      backup = await this.backupsRepo.findOne({
        where: { id: backupId },
      });
      if (!backup || backup.status !== 'ready') {
        throw new NotFoundException('Backup not found');
      }

      const encryptionMeta = backup.encryptionMeta ?? null;
      const password = options?.encryptionPassword ?? null;
      if (encryptionMeta && (!password || password.trim().length === 0)) {
        throw new BadRequestException('Encryption password is required');
      }

      this.updateJob(jobId, {
        stage: 'hashing',
        percent: 15,
        message: 'Validating checksum',
      });

      const sha = await sha256File(backup.path);
      if (sha !== backup.sha256) {
        throw new BadRequestException(
          'Checksum mismatch (file may be corrupted)',
        );
      }

      let restoreInputPath = backup.path;
      let tmpDecryptedPath: string | null = null;

      if (encryptionMeta) {
        const backupsDir = buildBackupsDir();
        await fs.promises.mkdir(backupsDir, { recursive: true });
        tmpDecryptedPath = path.join(
          backupsDir,
          `.tmp_restore_${backup.id}_${Date.now()}_${Math.random().toString(16).slice(2)}.sql`,
        );

        this.updateJob(jobId, {
          stage: 'preparing',
          percent: 22,
          message: 'Decrypting backup',
        });

        try {
          await decryptFileToPath(
            backup.path,
            tmpDecryptedPath,
            password ?? '',
            encryptionMeta,
          );
        } catch {
          throw new BadRequestException('Invalid encryption password');
        }

        restoreInputPath = tmpDecryptedPath;
      }

      await this.logAction(backup.id, 'restore_started', actor, {
        filename: backup.filename,
      });

      this.updateJob(jobId, {
        stage: 'preparing',
        percent: 25,
        message: 'Creating safety backup (pre-restore)',
      });

      // Safety backup before restoring
      const safetyJob = this.createJob('create');
      this.updateJob(safetyJob.id, {
        stage: 'preparing',
        percent: 0,
        message: 'Pre-restore backup',
      });
      await this.runCreateBackupJob(safetyJob.id, {
        actorUserId: actor.actorUserId,
        actorEmail: actor.actorEmail,
        type: 'pre_restore',
      });

      const db = getDbEnv();

      this.updateJob(jobId, {
        stage: 'running',
        percent: 60,
        message: 'Restoring database',
      });

      const psqlArgs = [
        '-h',
        db.host,
        '-p',
        db.port,
        '-U',
        db.user,
        '-d',
        db.db,
        '--set',
        'ON_ERROR_STOP=on',
        '--single-transaction',
        '-f',
        restoreInputPath,
      ];

      const { exitCode, stderr } = await runProcess('psql', psqlArgs, {
        PGPASSWORD: db.password,
      });

      if (exitCode !== 0) {
        const cannotTx = /cannot run inside a transaction block/i.test(stderr);
        const msg = cannotTx
          ? 'Restore failed: script contains statements that cannot run inside a transaction. For safety, restore was aborted.'
          : stderr || `psql failed with code ${exitCode}`;
        await this.logAction(backup.id, 'restore_failed', actor, {
          error: msg,
        });
        throw new Error(msg);
      }

      await this.logAction(backup.id, 'restore_completed', actor, {
        filename: backup.filename,
      });

      this.finishJob(jobId, {
        stage: 'done',
        percent: 100,
        message: 'Restore completed',
        error: null,
        backupId: backup.id,
      });

      if (tmpDecryptedPath) {
        try {
          await fs.promises.rm(tmpDecryptedPath, { force: true });
        } catch {
          void 0;
        }
      }
    } catch (err) {
      if (backup?.encryptionMeta) {
        try {
          const backupsDir = buildBackupsDir();
          const files = await fs.promises.readdir(backupsDir);
          const tmpPaths: string[] = [];

          for (const f of files) {
            if (f.startsWith(`.tmp_restore_${backupId}_`)) {
              tmpPaths.push(path.join(backupsDir, f));
            }
          }

          if (tmpPaths.length > 0) {
            await Promise.all(
              tmpPaths.map(async (p) => {
                try {
                  await fs.promises.rm(p, { force: true });
                } catch {
                  void 0;
                }
              }),
            );
          }
        } catch {
          void 0;
        }
      }

      const message = err instanceof Error ? err.message : 'Restore failed';
      this.finishJob(jobId, {
        stage: 'failed',
        percent: 100,
        message: 'Restore failed',
        error: message,
      });
    }
  }

  async getBackupDownload(
    id: string,
    password: string | null,
  ): Promise<BackupDownloadDto> {
    const backup = await this.backupsRepo.findOne({ where: { id } });
    if (!backup || backup.status !== 'ready') {
      throw new NotFoundException('Backup not found');
    }

    try {
      await fs.promises.access(backup.path, fs.constants.R_OK);
    } catch {
      throw new NotFoundException('Backup file not found on disk');
    }

    if (backup.encryptionMeta) {
      if (!password || password.trim().length === 0) {
        throw new BadRequestException('Encryption password is required');
      }

      const decipher = createDecryptionStream(password, backup.encryptionMeta);
      const s = fs.createReadStream(backup.path).pipe(decipher);
      return {
        filename: backup.filename,
        stream: s,
      };
    }

    return {
      filename: backup.filename,
      stream: fs.createReadStream(backup.path),
    };
  }

  async deleteBackup(
    id: string,
    actor: Actor,
    reason: BackupDeletionReason = 'manual',
  ): Promise<void> {
    const backup = await this.backupsRepo.findOne({ where: { id } });
    if (!backup) {
      throw new NotFoundException('Backup not found');
    }

    if (backup.status === 'deleted') {
      return;
    }

    try {
      await fs.promises.rm(backup.path, { force: true });
    } catch {
      // ignore
    }

    let remoteDeleted = false;
    if (backup.storage !== 'local') {
      try {
        const cfg = await this.settingsService.getOrCreateInstanceConfig();
        const remote = cfg.backupConfig?.remote ?? null;
        if (remote && remote.enabled === true && remote.provider === 's3') {
          const s3 = remote.s3 ?? null;
          if (s3?.accessKeyId && s3.secretAccessKey && s3.bucket && s3.region) {
            const prefix = (s3.prefix ?? 'backups').replace(/^\/+|\/+$/g, '');
            const key = prefix
              ? `${prefix}/${backup.filename}`
              : backup.filename;

            const endpoint =
              (process.env.S3_ENDPOINT ?? '').trim() || undefined;
            const forcePathStyle =
              process.env.S3_FORCE_PATH_STYLE === 'true' || !!endpoint;

            const client = new S3Client({
              region: s3.region,
              credentials: {
                accessKeyId: s3.accessKeyId,
                secretAccessKey: s3.secretAccessKey,
              },
              endpoint,
              forcePathStyle,
            });

            await client.send(
              new DeleteObjectCommand({
                Bucket: s3.bucket,
                Key: key,
              }),
            );
            remoteDeleted = true;
          }
        }
      } catch {
        // ignore
      }
    }

    backup.status = 'deleted';
    backup.errorMessage = null;
    backup.deletedByUserId = actor.actorUserId ?? null;
    backup.deletedByEmail = actor.actorEmail ?? null;
    backup.deletedReason = reason;
    backup.deletedAt = new Date();
    await this.backupsRepo.save(backup);
    await this.logAction(backup.id, 'backup_deleted', actor, {
      filename: backup.filename,
      remoteDeleted,
      reason,
    });
  }

  async getBackupRetentionConfig(): Promise<BackupRetentionConfigDto> {
    const cfg = await this.settingsService.getOrCreateInstanceConfig();
    const retention: InstanceBackupRetentionConfig | null =
      cfg.backupConfig?.retention ?? null;

    const timeEnabled = retention?.time?.enabled === true;
    const timePeriod = normalizeRetentionPeriod(
      retention?.time?.period ?? null,
    );

    const countEnabled = retention?.count?.enabled === true;
    const keepLast = normalizeKeepLast(retention?.count?.keepLast ?? 100);

    return {
      time: {
        enabled: timeEnabled,
        period: timePeriod,
      },
      count: {
        enabled: countEnabled,
        keepLast,
      },
    };
  }

  async updateBackupRetentionConfig(
    dto: UpdateBackupRetentionConfigDto,
    actor: Actor,
  ): Promise<BackupRetentionConfigDto> {
    const cfg = await this.settingsService.getOrCreateInstanceConfig();

    const currentRetention: InstanceBackupRetentionConfig = cfg.backupConfig
      ?.retention ?? {
      time: {
        enabled: false,
        period: 'monthly',
      },
      count: {
        enabled: false,
        keepLast: 100,
      },
    };

    const nextTimeEnabled =
      typeof dto.time?.enabled === 'boolean'
        ? dto.time.enabled
        : (currentRetention.time?.enabled ?? false);

    const nextTimePeriod =
      typeof dto.time?.period === 'undefined'
        ? normalizeRetentionPeriod(currentRetention.time?.period ?? null)
        : dto.time.period === null
          ? 'never'
          : normalizeRetentionPeriod(dto.time.period);

    const nextCountEnabled =
      typeof dto.count?.enabled === 'boolean'
        ? dto.count.enabled
        : (currentRetention.count?.enabled ?? false);

    const nextKeepLast =
      typeof dto.count?.keepLast === 'undefined'
        ? normalizeKeepLast(currentRetention.count?.keepLast ?? 100)
        : dto.count.keepLast === null
          ? 100
          : normalizeKeepLast(dto.count.keepLast);

    const nextRetention: InstanceBackupRetentionConfig = {
      time: {
        enabled: nextTimeEnabled,
        period: nextTimePeriod,
      },
      count: {
        enabled: nextCountEnabled,
        keepLast: nextKeepLast,
      },
    };

    cfg.backupConfig = {
      ...(cfg.backupConfig ?? {}),
      retention: nextRetention,
    };

    await this.instanceConfigRepo.save(cfg);
    await this.logAction(null, 'backup_synced', actor, {
      action: 'backup_retention_updated',
    });

    return await this.getBackupRetentionConfig();
  }

  private async logAction(
    backupId: string | null,
    action: BackupLogAction,
    actor: Actor,
    details?: Record<string, unknown>,
  ): Promise<void> {
    try {
      const entry = this.logsRepo.create({
        backupId,
        action,
        actorUserId: actor.actorUserId,
        actorEmail: actor.actorEmail,
        details: details ?? null,
      });
      await this.logsRepo.save(entry);
    } catch {
      // audit log must not break the operation
    }
  }

  private toListItem(b: Backup): BackupListItemDto {
    return {
      id: b.id,
      filename: b.filename,
      type: b.type,
      storage: b.storage,
      sizeBytes: b.sizeBytes,
      sha256: b.sha256,
      status: b.status,
      isEncrypted: !!b.encryptionMeta,
      errorMessage: b.errorMessage,
      createdByEmail: b.createdByEmail,
      createdAt: b.createdAt.toISOString(),
      deletedByEmail: b.deletedByEmail,
      deletedReason: b.deletedReason ?? null,
      deletedAt: b.deletedAt ? b.deletedAt.toISOString() : null,
    };
  }

  async getRemoteBackupConfig(): Promise<RemoteBackupConfigDto> {
    const cfg = await this.settingsService.getOrCreateInstanceConfig();
    const s3 = cfg.backupConfig?.remote?.s3 ?? null;
    const enabled = cfg.backupConfig?.remote?.enabled === true;
    return {
      enabled,
      provider: 's3',
      s3: {
        accessKeyId: (s3?.accessKeyId ?? null) || null,
        hasSecretAccessKey: !!(s3?.secretAccessKey ?? null),
        bucket: (s3?.bucket ?? null) || null,
        region: (s3?.region ?? null) || null,
        prefix: (s3?.prefix ?? null) || null,
      },
    };
  }

  async updateRemoteBackupConfig(
    dto: UpdateRemoteBackupConfigDto,
    actor: Actor,
  ): Promise<RemoteBackupConfigDto> {
    const cfg = await this.settingsService.getOrCreateInstanceConfig();
    const current =
      cfg.backupConfig ?? ({ remote: null } as InstanceBackupConfig);
    const currentRemote = current.remote ?? {
      enabled: false,
      provider: 's3',
      s3: null,
    };
    const currentS3: InstanceBackupRemoteS3Config = currentRemote.s3 ?? {
      accessKeyId: null,
      secretAccessKey: null,
      bucket: null,
      region: null,
      prefix: 'backups',
    };

    const nextEnabled =
      typeof dto.enabled === 'boolean'
        ? dto.enabled
        : (currentRemote.enabled ?? false);

    const patch = dto.s3 ?? {};

    const normalize = (v: unknown, max: number): string | null => {
      if (v === null) return null;
      if (typeof v !== 'string') return undefined as unknown as string | null;
      const t = v.trim();
      if (!t) return null;
      return t.slice(0, max);
    };

    const nextS3: InstanceBackupRemoteS3Config = {
      accessKeyId:
        typeof patch.accessKeyId === 'undefined'
          ? (currentS3.accessKeyId ?? null)
          : normalize(patch.accessKeyId, 128),
      secretAccessKey:
        typeof patch.secretAccessKey === 'undefined'
          ? (currentS3.secretAccessKey ?? null)
          : normalize(patch.secretAccessKey, 256),
      bucket:
        typeof patch.bucket === 'undefined'
          ? (currentS3.bucket ?? null)
          : normalize(patch.bucket, 128),
      region:
        typeof patch.region === 'undefined'
          ? (currentS3.region ?? null)
          : normalize(patch.region, 64),
      prefix:
        typeof patch.prefix === 'undefined'
          ? (currentS3.prefix ?? null)
          : normalize(patch.prefix, 256),
    };

    const next: InstanceBackupConfig = {
      ...(cfg.backupConfig ?? {}),
      remote: {
        enabled: nextEnabled,
        provider: 's3',
        s3: nextS3,
      },
    };

    cfg.backupConfig = next;
    await this.instanceConfigRepo.save(cfg);
    await this.logAction(null, 'backup_synced', actor, {
      action: 'remote_config_updated',
    });

    return await this.getRemoteBackupConfig();
  }

  async testRemoteBackupConfig(): Promise<{ ok: boolean }> {
    const cfg = await this.settingsService.getOrCreateInstanceConfig();
    const remote = cfg.backupConfig?.remote ?? null;
    const s3 = remote?.s3 ?? null;

    if (!s3?.accessKeyId || !s3.secretAccessKey || !s3.bucket || !s3.region) {
      throw new BadRequestException('Missing S3 credentials/config');
    }

    const endpoint = (process.env.S3_ENDPOINT ?? '').trim() || undefined;
    const forcePathStyle =
      process.env.S3_FORCE_PATH_STYLE === 'true' || !!endpoint;

    const client = new S3Client({
      region: s3.region,
      credentials: {
        accessKeyId: s3.accessKeyId,
        secretAccessKey: s3.secretAccessKey,
      },
      endpoint,
      forcePathStyle,
    });

    await client.send(new HeadBucketCommand({ Bucket: s3.bucket }));
    return { ok: true };
  }

  async getBackupScheduleConfig(): Promise<BackupScheduleConfigDto> {
    const cfg = await this.settingsService.getOrCreateInstanceConfig();
    const schedule = cfg.backupConfig?.schedule ?? null;

    const rawTimes =
      schedule?.timesOfDay && Array.isArray(schedule.timesOfDay)
        ? schedule.timesOfDay
        : schedule?.timeOfDay
          ? [schedule.timeOfDay]
          : [];
    const times = rawTimes
      .map((t) => (typeof t === 'string' ? t.trim() : ''))
      .filter((t) => /^([01]\d|2[0-3]):[0-5]\d$/.test(t));
    const timesOfDay = Array.from(new Set(times)).sort();
    const timeOfDay = timesOfDay[0] ?? schedule?.timeOfDay ?? null;

    return {
      enabled: schedule?.enabled === true,
      timezone: schedule?.timezone ?? null,
      timeOfDay,
      timesOfDay,
      lastRunAt: schedule?.lastRunAt ?? null,
      hasEncryptionPassword:
        typeof schedule?.encryptionPassword === 'string' &&
        schedule.encryptionPassword.trim().length > 0,
    };
  }

  async updateBackupScheduleConfig(
    dto: UpdateBackupScheduleConfigDto,
    actor: Actor,
  ): Promise<BackupScheduleConfigDto> {
    const cfg = await this.settingsService.getOrCreateInstanceConfig();
    const current =
      cfg.backupConfig ??
      ({ remote: null, schedule: null } as InstanceBackupConfig);

    const currentSchedule: InstanceBackupScheduleConfig = current.schedule ?? {
      enabled: false,
      timezone: 'Europe/Sofia',
      timeOfDay: '03:00',
      lastRunAt: null,
    };

    const nextEnabled =
      typeof dto.enabled === 'boolean'
        ? dto.enabled
        : (currentSchedule.enabled ?? false);

    const nextTimezone =
      typeof dto.timezone === 'undefined'
        ? (currentSchedule.timezone ?? null)
        : normalizeTimezone(dto.timezone);

    const currentTimes =
      currentSchedule.timesOfDay && Array.isArray(currentSchedule.timesOfDay)
        ? currentSchedule.timesOfDay
        : currentSchedule.timeOfDay
          ? [currentSchedule.timeOfDay]
          : null;

    const nextTimesOfDay =
      typeof dto.timesOfDay !== 'undefined'
        ? normalizeScheduleTimes(dto.timesOfDay)
        : typeof dto.timeOfDay !== 'undefined'
          ? (() => {
              const single = normalizeScheduleTime(dto.timeOfDay);
              return single ? [single] : null;
            })()
          : currentTimes;

    const nextTimeOfDay = nextTimesOfDay?.[0] ?? null;

    const timezoneChanged =
      (nextTimezone ?? null) !== (currentSchedule.timezone ?? null);
    const normalizeCompareTimes = (value: string[] | null | undefined) =>
      (Array.isArray(value) ? value : [])
        .filter((t) => typeof t === 'string' && t.trim().length > 0)
        .map((t) => t.trim())
        .sort()
        .join(',');

    const timeChanged =
      normalizeCompareTimes(nextTimesOfDay) !==
      normalizeCompareTimes(currentTimes);
    const enabledChanged = (currentSchedule.enabled ?? false) !== nextEnabled;

    const shouldResetLastRun =
      timezoneChanged || timeChanged || (enabledChanged && nextEnabled);

    const nextSchedule: InstanceBackupScheduleConfig = {
      enabled: nextEnabled,
      timezone: nextTimezone,
      timeOfDay: nextTimeOfDay,
      timesOfDay: nextTimesOfDay,
      lastRunAt: shouldResetLastRun
        ? null
        : (currentSchedule.lastRunAt ?? null),
      lastRunKey: shouldResetLastRun
        ? null
        : (currentSchedule.lastRunKey ?? null),
      encryptionPassword:
        typeof dto.encryptionPassword === 'undefined'
          ? (currentSchedule.encryptionPassword ?? null)
          : (() => {
              const raw = dto.encryptionPassword;
              if (raw === null) return null;
              if (typeof raw !== 'string') return null;
              const trimmed = raw.trim();
              return trimmed.length > 0 ? trimmed : null;
            })(),
    };

    cfg.backupConfig = {
      ...(cfg.backupConfig ?? {}),
      schedule: nextSchedule,
    };

    await this.instanceConfigRepo.save(cfg);
    await this.logAction(null, 'backup_synced', actor, {
      action: 'backup_schedule_updated',
    });

    return await this.getBackupScheduleConfig();
  }

  async startScheduledBackupNow(actor: Actor): Promise<BackupJobStatus> {
    const cfg = await this.settingsService.getOrCreateInstanceConfig();
    const schedule = cfg.backupConfig?.schedule ?? null;
    return this.startCreateBackupJob({
      actorUserId: actor.actorUserId,
      actorEmail: actor.actorEmail,
      type: 'scheduled',
      encryptionPassword: schedule?.encryptionPassword ?? null,
    });
  }

  private async trySyncBackupToRemote(
    backup: Backup,
    actor: Actor,
  ): Promise<void> {
    try {
      const cfg = await this.settingsService.getOrCreateInstanceConfig();
      const remote = cfg.backupConfig?.remote ?? null;
      if (!remote || remote.enabled !== true || remote.provider !== 's3') {
        return;
      }

      const s3 = remote.s3 ?? null;
      if (!s3?.accessKeyId || !s3.secretAccessKey || !s3.bucket || !s3.region) {
        await this.logAction(backup.id, 'backup_sync_failed', actor, {
          error: 'Missing S3 credentials/config',
        });
        return;
      }

      const prefix = (s3.prefix ?? 'backups').replace(/^\/+|\/+$/g, '');
      const key = prefix ? `${prefix}/${backup.filename}` : backup.filename;

      const endpoint = (process.env.S3_ENDPOINT ?? '').trim() || undefined;
      const forcePathStyle =
        process.env.S3_FORCE_PATH_STYLE === 'true' || !!endpoint;

      const client = new S3Client({
        region: s3.region,
        credentials: {
          accessKeyId: s3.accessKeyId,
          secretAccessKey: s3.secretAccessKey,
        },
        endpoint,
        forcePathStyle,
      });

      let lastErr: unknown = null;

      for (let attempt = 1; attempt <= 3; attempt += 1) {
        try {
          await client.send(
            new PutObjectCommand({
              Bucket: s3.bucket,
              Key: key,
              Body: fs.createReadStream(backup.path),
              ContentType: 'application/sql; charset=utf-8',
            }),
          );
          backup.storage = backup.storage === 'local' ? 'both' : backup.storage;
          await this.backupsRepo.save(backup);
          await this.logAction(backup.id, 'backup_synced', actor, {
            provider: 's3',
            bucket: s3.bucket,
            key,
          });
          return;
        } catch (err) {
          lastErr = err;
          if (attempt < 3) {
            await new Promise((r) => setTimeout(r, attempt * 500));
          }
        }
      }

      const msg =
        lastErr instanceof Error ? lastErr.message : 'Remote sync failed';
      await this.logAction(backup.id, 'backup_sync_failed', actor, {
        provider: 's3',
        error: msg,
      });
    } catch {
      // ignore
    }
  }
}
