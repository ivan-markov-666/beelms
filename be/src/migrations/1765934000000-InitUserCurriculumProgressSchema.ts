import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class InitUserCurriculumProgressSchema1765934000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'user_curriculum_progress',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'user_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'course_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'curriculum_item_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'completed_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
        ],
        foreignKeys: [
          {
            columnNames: ['user_id'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
          {
            columnNames: ['course_id'],
            referencedTableName: 'courses',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
          {
            columnNames: ['curriculum_item_id'],
            referencedTableName: 'course_curriculum_items',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'user_curriculum_progress',
      new TableIndex({
        name: 'IDX_user_curriculum_progress_user_item',
        columnNames: ['user_id', 'curriculum_item_id'],
        isUnique: true,
      }),
    );

    await queryRunner.createIndex(
      'user_curriculum_progress',
      new TableIndex({
        name: 'IDX_user_curriculum_progress_user_course',
        columnNames: ['user_id', 'course_id'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex(
      'user_curriculum_progress',
      'IDX_user_curriculum_progress_user_course',
    );
    await queryRunner.dropIndex(
      'user_curriculum_progress',
      'IDX_user_curriculum_progress_user_item',
    );
    await queryRunner.dropTable('user_curriculum_progress');
  }
}
