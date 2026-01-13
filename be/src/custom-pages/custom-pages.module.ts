import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SettingsModule } from '../settings/settings.module';
import { AuthModule } from '../auth/auth.module';
import { CustomPage } from './custom-page.entity';
import { CustomPagesService } from './custom-pages.service';
import { AdminCustomPagesController } from './admin-custom-pages.controller';
import { CustomPagesController } from './custom-pages.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CustomPage]), SettingsModule, AuthModule],
  controllers: [AdminCustomPagesController, CustomPagesController],
  providers: [CustomPagesService],
  exports: [TypeOrmModule, CustomPagesService],
})
export class CustomPagesModule {}
