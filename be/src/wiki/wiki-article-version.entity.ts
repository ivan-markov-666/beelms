import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { WikiArticle } from './wiki-article.entity';

@Entity('wiki_article_versions')
export class WikiArticleVersion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => WikiArticle, (article) => article.versions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'article_id' })
  article: WikiArticle;

  @Column({ type: 'varchar', length: 8 })
  language: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ name: 'version_number', type: 'int' })
  versionNumber: number;

  @Column({ name: 'created_by_user_id', type: 'uuid', nullable: true })
  createdByUserId: string | null;

  @Column({ name: 'change_summary', type: 'text', nullable: true })
  changeSummary: string | null;

  @Column({ name: 'is_published', type: 'boolean', default: false })
  isPublished: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
