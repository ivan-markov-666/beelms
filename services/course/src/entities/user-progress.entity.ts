import { User } from '@auth/entities/user.entity';
import { BaseEntity } from '@shared/entities/base.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { Chapter } from './chapter.entity';
import { Content } from './content.entity';

@Entity('user_progress')
export class UserProgress extends BaseEntity {
  @Column({ name: 'user_id' })
  @Index('idx_user_progress_user_id')
  userId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'chapter_id' })
  @Index('idx_user_progress_chapter_id')
  chapterId: number;

  @ManyToOne(() => Chapter, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'chapter_id' })
  chapter: Chapter;

  @Column({ name: 'content_id', nullable: true })
  contentId: number | null;

  @ManyToOne(() => Content, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'content_id' })
  content: Content | null;

  @Column({ default: false })
  completed: boolean;

  @Column({ name: 'progress_percentage', default: 0 })
  progressPercentage: number;

  @Column({ name: 'last_accessed', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  lastAccessed: Date;
}
