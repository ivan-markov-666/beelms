import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { BackupRetentionService } from './backup-retention.service';
import { BackupsService } from './backups.service';
import type {
  BackupRetentionConfigDto,
  BackupJobStatus,
  BackupListItemDto,
  BackupScheduleConfigDto,
  UploadedBackupFile,
  UpdateBackupRetentionConfigDto,
  UpdateBackupScheduleConfigDto,
  UploadBackupResponseDto,
  RemoteBackupConfigDto,
  UpdateRemoteBackupConfigDto,
} from './backups.service';

type AuthenticatedRequest = Request & {
  user?: {
    userId: string;
    email: string;
  };
};

@Controller('admin/backups')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminBackupsController {
  constructor(
    private readonly backupsService: BackupsService,
    private readonly backupRetentionService: BackupRetentionService,
  ) {}

  @Get()
  async listBackups(
    @Query('showDeleted') showDeleted: string | undefined,
  ): Promise<BackupListItemDto[]> {
    const includeDeleted = ['1', 'true', 'yes'].includes(
      (showDeleted ?? '').toLowerCase(),
    );
    return await this.backupsService.listBackups({
      showDeleted: includeDeleted,
    });
  }

  @Get('remote-config')
  async getRemoteConfig(): Promise<RemoteBackupConfigDto> {
    return await this.backupsService.getRemoteBackupConfig();
  }

  @Patch('remote-config')
  async patchRemoteConfig(
    @Body() dto: UpdateRemoteBackupConfigDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<RemoteBackupConfigDto> {
    const actorUserId = req.user?.userId;
    if (!actorUserId) {
      throw new UnauthorizedException('Authenticated user not found');
    }

    return await this.backupsService.updateRemoteBackupConfig(dto, {
      actorUserId,
      actorEmail: req.user?.email ?? null,
    });
  }

  @Post('remote-config/test')
  async testRemoteConfig(): Promise<{ ok: boolean }> {
    return await this.backupsService.testRemoteBackupConfig();
  }

  @Get('schedule')
  async getSchedule(): Promise<BackupScheduleConfigDto> {
    return await this.backupsService.getBackupScheduleConfig();
  }

  @Get('retention')
  async getRetention(): Promise<BackupRetentionConfigDto> {
    return await this.backupsService.getBackupRetentionConfig();
  }

  @Patch('retention')
  async patchRetention(
    @Body() dto: UpdateBackupRetentionConfigDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<BackupRetentionConfigDto> {
    const actorUserId = req.user?.userId;
    if (!actorUserId) {
      throw new UnauthorizedException('Authenticated user not found');
    }

    const updated = await this.backupsService.updateBackupRetentionConfig(dto, {
      actorUserId,
      actorEmail: req.user?.email ?? null,
    });

    void this.backupRetentionService.runOnce();

    return updated;
  }

  @Patch('schedule')
  async patchSchedule(
    @Body() dto: UpdateBackupScheduleConfigDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<BackupScheduleConfigDto> {
    const actorUserId = req.user?.userId;
    if (!actorUserId) {
      throw new UnauthorizedException('Authenticated user not found');
    }

    return await this.backupsService.updateBackupScheduleConfig(dto, {
      actorUserId,
      actorEmail: req.user?.email ?? null,
    });
  }

  @Post('schedule/run-now')
  async runScheduleNow(
    @Req() req: AuthenticatedRequest,
  ): Promise<{ jobId: string }> {
    const actorUserId = req.user?.userId;
    if (!actorUserId) {
      throw new UnauthorizedException('Authenticated user not found');
    }

    const job = await this.backupsService.startScheduledBackupNow({
      actorUserId,
      actorEmail: req.user?.email ?? null,
    });

    return { jobId: job.id };
  }

  @Post()
  createBackup(
    @Req() req: AuthenticatedRequest,
    @Body() body: { encryptionPassword?: string | null },
  ): { jobId: string } {
    const actorUserId = req.user?.userId;
    if (!actorUserId) {
      throw new UnauthorizedException('Authenticated user not found');
    }

    const job = this.backupsService.startCreateBackupJob({
      actorUserId,
      actorEmail: req.user?.email ?? null,
      type: 'manual',
      encryptionPassword: body?.encryptionPassword ?? null,
    });

    return { jobId: job.id };
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadBackup(
    @UploadedFile() file: UploadedBackupFile | undefined,
    @Req() req: AuthenticatedRequest,
    @Body() body: { encryptionPassword?: string | null },
  ): Promise<UploadBackupResponseDto> {
    const actorUserId = req.user?.userId;
    if (!actorUserId) {
      throw new UnauthorizedException('Authenticated user not found');
    }

    return await this.backupsService.uploadBackup(
      file,
      {
        actorUserId,
        actorEmail: req.user?.email ?? null,
      },
      { encryptionPassword: body?.encryptionPassword ?? null },
    );
  }

  @Get('jobs/:jobId')
  getJob(@Param('jobId') jobId: string): BackupJobStatus {
    const job = this.backupsService.getJob(jobId);
    if (!job) {
      throw new NotFoundException('Job not found');
    }
    return job;
  }

  @Post(':id/restore')
  restoreBackup(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
    @Body() body: { encryptionPassword?: string | null },
  ): { jobId: string } {
    const actorUserId = req.user?.userId;
    if (!actorUserId) {
      throw new UnauthorizedException('Authenticated user not found');
    }

    const job = this.backupsService.startRestoreBackupJob(
      id,
      {
        actorUserId,
        actorEmail: req.user?.email ?? null,
      },
      { encryptionPassword: body?.encryptionPassword ?? null },
    );

    return { jobId: job.id };
  }

  @Get(':id/download')
  async download(
    @Param('id') id: string,
    @Headers('x-backup-password') password: string | undefined,
    @Res() res: Response,
  ): Promise<void> {
    const dl = await this.backupsService.getBackupDownload(
      id,
      password ?? null,
    );
    res.setHeader('Content-Type', 'application/sql; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${dl.filename}"`,
    );
    dl.stream.pipe(res);
  }

  @Delete(':id')
  @HttpCode(204)
  async deleteBackup(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<void> {
    const actorUserId = req.user?.userId;
    if (!actorUserId) {
      throw new UnauthorizedException('Authenticated user not found');
    }

    await this.backupsService.deleteBackup(id, {
      actorUserId,
      actorEmail: req.user?.email ?? null,
    });
  }
}
