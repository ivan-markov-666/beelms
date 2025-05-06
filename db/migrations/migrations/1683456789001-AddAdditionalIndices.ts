import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAdditionalIndices1683456789001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Добавяне на комбиниран индекс за потребителски прогрес
    await queryRunner.query(`
      CREATE INDEX idx_user_progress_user_chapter ON user_progress (user_id, chapter_id)
    `);

    // Добавяне на индекс за търсене на съдържание
    await queryRunner.query(`
      CREATE INDEX idx_content_title_text ON contents USING gin(to_tsvector('simple', title || ' ' || content))
    `);

    // Добавяне на комбиниран индекс за тестови опити
    await queryRunner.query(`
      CREATE INDEX idx_user_test_attempts_user_test ON user_test_attempts (user_id, test_id)
    `);

    // Добавяне на индекс за търсене на курсове
    await queryRunner.query(`
      CREATE INDEX idx_course_title_description ON courses USING gin(to_tsvector('simple', title || ' ' || COALESCE(description, '')))
    `);

    // Индекс за статистики на реклами
    await queryRunner.query(`
      CREATE INDEX idx_advertisement_status ON advertisements (is_active, start_date, end_date)
    `);

    // Индекс за поглеждане на реклами от потребители
    await queryRunner.query(`
      CREATE INDEX idx_user_ad_views_user_viewed ON user_ad_views (user_id, viewed_at)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_user_progress_user_chapter`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_content_title_text`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_user_test_attempts_user_test`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_course_title_description`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_advertisement_status`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_user_ad_views_user_viewed`);
  }
}
