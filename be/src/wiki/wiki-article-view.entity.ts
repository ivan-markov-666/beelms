import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { WikiArticle } from './wiki-article.entity';

@Entity('wiki_article_views')
@Index(['articleId', 'language', 'viewDate'], { unique: true })
export class WikiArticleView {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'article_id', type: 'uuid' })
  articleId: string;

  @Column({ type: 'varchar', length: 8 })
  language: string;

  @Column({ name: 'view_date', type: 'date' })
  viewDate: string;

  @Column({ name: 'view_count', type: 'int', default: 0 })
  viewCount: number;

  @ManyToOne(() => WikiArticle, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'article_id' })
  article: WikiArticle;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
