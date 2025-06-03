import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { UserProgress } from './user-progress.entity';

@Entity('user_progress_stats')
export class UserProgressStats {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userProgressId: number;

  @Column()
  userId: number;

  @Column({ nullable: true })
  contentId: number;

  @Column({ nullable: true })
  chapterId: number;

  @Column({ default: 0 })
  timeSpentSeconds: number;

  @Column({ default: 0 })
  visitCount: number;

  @Column('json', { nullable: true })
  interactions: Record<string, any>;

  @Column({ type: 'timestamp', nullable: true })
  sessionStartTime: Date;

  @Column({ type: 'timestamp', nullable: true })
  sessionEndTime: Date;

  @Column({ nullable: true })
  deviceInfo: string;

  @ManyToOne(() => UserProgress, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userProgressId' })
  userProgress: UserProgress;

  @CreateDateColumn()
  createdAt: Date;
}
