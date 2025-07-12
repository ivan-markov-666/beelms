import { Column, Entity, ManyToOne, JoinColumn, Index, Unique } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { Topic } from './topic.entity';

@Entity('user_progress')
@Unique(['userId', 'topicId'])
export class UserProgress extends BaseEntity {
  @Column({ name: 'user_id', type: 'uuid' })
  @Index('idx_user_progress_user_id')
  userId!: string;

  @Column({ name: 'topic_id', type: 'uuid' })
  @Index('idx_user_progress_topic_id')
  topicId!: string;

  @Column({ name: 'is_completed', type: 'boolean', default: false })
  isCompleted!: boolean;

  @Column({ name: 'completed_at', type: 'datetime', nullable: true })
  completedAt!: Date | null;

  // За SQLite съвместимост използваме 'simple-json' вместо 'jsonb'
  @Column({ name: 'progress_data', type: 'simple-json', nullable: true })
  progressData!: Record<string, unknown> | null;

  // Relationships
  @ManyToOne(() => User, (user: User) => user.progress, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @ManyToOne(() => Topic, (topic: Topic) => topic.userProgress, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'topic_id' })
  topic!: Topic;
}
