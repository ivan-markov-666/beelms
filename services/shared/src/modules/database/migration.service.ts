import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';

@Injectable()
export class MigrationService {
  private readonly logger = new Logger(MigrationService.name);

  constructor(private readonly dataSource: DataSource, private readonly configService: ConfigService) {}

  async runMigrations(): Promise<void> {
    // Проверка дали трябва автоматично да се изпълнят миграциите
    const autoMigrate = this.configService.get<boolean>('DATABASE_AUTO_MIGRATE', false);

    if (autoMigrate) {
      this.logger.log('Автоматично изпълнение на миграциите...');

      try {
        const migrations = await this.dataSource.runMigrations();
        this.logger.log(`Успешно изпълнени ${migrations.length} миграции`);
      } catch (error) {
        this.logger.error('Грешка при изпълнение на миграциите', error);
        throw error;
      }
    } else {
      this.logger.log('Автоматичното изпълнение на миграциите е изключено');
    }
  }
}
