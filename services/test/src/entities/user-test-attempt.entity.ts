import { User } from '@auth/entities/user.entity';
import { BaseEntity } from '@shared/entities/base.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { Test } from './test.entity';
import { UserAnswer } from './user-answer.entity';

@Entity('user_test_attempts')
export class UserTestAttempt extends BaseEntity {
  @Column({ name: 'user_id' })
  @Index('idx_user_test_attempts_user_id')
  userId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'test_id' })
  @Index('idx_user_test_attempts_test_id')
  testId: number;

  @ManyToOne(() => Test, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'test_id' })
  test: Test;

  @Column({ default: 0 })
  score: number;

  @Column({ default: false })
  passed: boolean;

  @Column({ name: 'time_spent', default: 0 })
  timeSpent: number;

  @Column({ name: 'started_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  startedAt: Date;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt: Date | null;

  @OneToMany(() => UserAnswer, (answer) => answer.attempt)
  answers: UserAnswer[];
}
