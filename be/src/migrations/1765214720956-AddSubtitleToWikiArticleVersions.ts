import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSubtitleToWikiArticleVersions1765214720956 implements MigrationInterface {
    name = 'AddSubtitleToWikiArticleVersions1765214720956'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "wiki_article_versions" DROP CONSTRAINT "FK_wiki_article_versions_article_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_wiki_article_versions_article_lang_version"`);
        await queryRunner.query(`ALTER TABLE "wiki_article_versions" ADD "subtitle" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "wiki_article_versions" DROP COLUMN "created_at"`);
        await queryRunner.query(`ALTER TABLE "wiki_article_versions" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "wiki_article_versions" ALTER COLUMN "article_id" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "wiki_articles" DROP COLUMN "created_at"`);
        await queryRunner.query(`ALTER TABLE "wiki_articles" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "wiki_articles" DROP COLUMN "updated_at"`);
        await queryRunner.query(`ALTER TABLE "wiki_articles" ADD "updated_at" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "created_at"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "updated_at"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "updated_at" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "wiki_article_versions" ADD CONSTRAINT "FK_ebdff836ad0d4d60e8be7756c88" FOREIGN KEY ("article_id") REFERENCES "wiki_articles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "wiki_article_versions" DROP CONSTRAINT "FK_ebdff836ad0d4d60e8be7756c88"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "updated_at"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "created_at"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "wiki_articles" DROP COLUMN "updated_at"`);
        await queryRunner.query(`ALTER TABLE "wiki_articles" ADD "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "wiki_articles" DROP COLUMN "created_at"`);
        await queryRunner.query(`ALTER TABLE "wiki_articles" ADD "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "wiki_article_versions" ALTER COLUMN "article_id" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "wiki_article_versions" DROP COLUMN "created_at"`);
        await queryRunner.query(`ALTER TABLE "wiki_article_versions" ADD "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "wiki_article_versions" DROP COLUMN "subtitle"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_wiki_article_versions_article_lang_version" ON "wiki_article_versions" ("article_id", "language", "version_number") `);
        await queryRunner.query(`ALTER TABLE "wiki_article_versions" ADD CONSTRAINT "FK_wiki_article_versions_article_id" FOREIGN KEY ("article_id") REFERENCES "wiki_articles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
