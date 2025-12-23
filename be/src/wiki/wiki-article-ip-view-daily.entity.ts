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

@Entity('wiki_article_ip_views_daily')
@Index(['articleId', 'language', 'viewDate', 'ipHash'], { unique: true })
export class WikiArticleIpViewDaily {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'article_id', type: 'uuid' })
  articleId: string;

  @Column({ type: 'varchar', length: 8 })
  language: string;

  @Column({ name: 'view_date', type: 'date' })
  viewDate: string;

  @Column({ name: 'ip_hash', type: 'varchar', length: 64 })
  ipHash: string;

  @Column({ name: 'session_count', type: 'int', default: 0 })
  sessionCount: number;

  @Column({ name: 'last_seen_at', type: 'timestamptz' })
  lastSeenAt: Date;

  @ManyToOne(() => WikiArticle, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'article_id' })
  article: WikiArticle;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
