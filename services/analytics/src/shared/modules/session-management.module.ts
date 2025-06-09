import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SessionManagementService } from '../services/session-management.service';

@Module({
  imports: [ConfigModule],
  providers: [SessionManagementService],
  exports: [SessionManagementService],
})
export class SessionManagementModule {}
