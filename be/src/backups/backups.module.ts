import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { InstanceConfig } from '../settings/instance-config.entity';
import { SettingsModule } from '../settings/settings.module';
import { Backup } from './backup.entity';
import { BackupLog } from './backup-log.entity';
import { BackupSchedulerService } from './backup-scheduler.service';
import { BackupRetentionService } from './backup-retention.service';
import { AdminBackupsController } from './admin-backups.controller';
import { BackupsService } from './backups.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Backup, BackupLog, InstanceConfig]),
    AuthModule,
    SettingsModule,
  ],
  providers: [BackupsService, BackupSchedulerService, BackupRetentionService],
  controllers: [AdminBackupsController],
})
export class BackupsModule {}
