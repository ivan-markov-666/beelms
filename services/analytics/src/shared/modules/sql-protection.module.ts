import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SqlSanitizerService } from '../services/sql-sanitizer.service';

/**
 * SQL Protection Module
 *
 * Осигурява защита срещу SQL инжекции чрез SQL Sanitizer Service
 */
@Global()
@Module({
  imports: [ConfigModule],
  providers: [SqlSanitizerService],
  exports: [SqlSanitizerService],
})
export class SqlProtectionModule {}
