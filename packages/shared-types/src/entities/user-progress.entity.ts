import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  Index,
} from 'typeorm';
import { IsUUID, IsInt, Min, Max, IsDate, IsOptional } from 'class-validator';
import { User } from './user.entity';
import { Topic } from './topic.entity';

/**
 * Tracks a user's reading progress for a given topic (lesson).
 * We avoid enum/timestamp types for SQLite compatibility — use varchar/datetime etc.
 */
@Entity('user_progress')
export class UserProgress {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  @IsUUID('all')
  @Index('idx_user_progress_user_id')
  userId!: string;

  @ManyToOne(() => User, (u) => u.progresses, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column({ type: 'uuid' })
  @IsUUID('all')
  @Index('idx_user_progress_topic_id')
  topicId!: string;

  @ManyToOne(() => Topic, (t) => t.progresses, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'topicId' })
  topic!: Topic;

  /** Percentage 0–100 */
  @Column({ type: 'int', default: 0 })
  @IsInt()
  @Min(0)
  @Max(100)
  progressPercent!: number;

  /** Last time the user opened the lesson */
  @Column({ type: 'datetime', nullable: true })
  @IsOptional()
  @IsDate()
  lastVisitAt?: Date;

  @CreateDateColumn({ type: 'datetime' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt!: Date;

  /** Convenience: whether the lesson is completed */
  isCompleted(): boolean {
    return this.progressPercent >= 100;
  }
}
