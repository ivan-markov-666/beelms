import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SecurityMonitoringService } from '../services/security-monitoring.service';
import { IpBlockingModule } from './ip-blocking.module';

@Module({
  imports: [ConfigModule, IpBlockingModule],
  providers: [SecurityMonitoringService],
  exports: [SecurityMonitoringService],
})
export class SecurityMonitoringModule {}
