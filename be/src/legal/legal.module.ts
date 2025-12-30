import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SettingsModule } from '../settings/settings.module';
import { AuthModule } from '../auth/auth.module';
import { LegalController } from './legal.controller';
import { AdminLegalController } from './admin-legal.controller';
import { LegalPage } from './legal-page.entity';
import { LegalService } from './legal.service';

@Module({
  imports: [TypeOrmModule.forFeature([LegalPage]), SettingsModule, AuthModule],
  controllers: [LegalController, AdminLegalController],
  providers: [LegalService],
  exports: [TypeOrmModule, LegalService],
})
export class LegalModule {}
