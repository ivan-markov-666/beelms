import { Module } from '@nestjs/common';
import 'reflect-metadata';
import { AppConfigModule } from './config/config.module';

@Module({
  imports: [AppConfigModule],
})
export class AppModule {}
