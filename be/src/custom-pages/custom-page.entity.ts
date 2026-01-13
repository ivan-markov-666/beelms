import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('custom_pages')
export class CustomPage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 64, unique: true })
  slug: string;

  @Column({ type: 'varchar', length: 256 })
  title: string;

  @Column({ name: 'title_by_lang', type: 'jsonb', nullable: true })
  titleByLang: Record<string, string> | null;

  @Column({ name: 'content_markdown', type: 'text' })
  contentMarkdown: string;

  @Column({ name: 'content_markdown_by_lang', type: 'jsonb', nullable: true })
  contentMarkdownByLang: Record<string, string> | null;

  @Column({ name: 'is_published', type: 'boolean', default: true })
  isPublished: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
