import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddVisibilityAndTagsToWikiArticles1765932000000
  implements MigrationInterface
{
  name = 'AddVisibilityAndTagsToWikiArticles1765932000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "wiki_articles" ADD "visibility" character varying(20) NOT NULL DEFAULT 'public'`,
    );
    await queryRunner.query(
      `ALTER TABLE "wiki_articles" ADD "tags" text array NOT NULL DEFAULT '{}'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "wiki_articles" DROP COLUMN "tags"`);
    await queryRunner.query(
      `ALTER TABLE "wiki_articles" DROP COLUMN "visibility"`,
    );
  }
}
