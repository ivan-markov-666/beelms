import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { WikiArticle } from './wiki-article.entity';
import { User } from '../auth/user.entity';

@Entity('wiki_article_feedback')
export class WikiArticleFeedback {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'article_id', type: 'uuid' })
  articleId: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string | null;

  @Column({ type: 'boolean' })
  helpful: boolean;

  @ManyToOne(() => WikiArticle, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'article_id' })
  article: WikiArticle;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
