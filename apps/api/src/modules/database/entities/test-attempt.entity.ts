import { Column, Entity, ManyToOne, JoinColumn, Index, Unique } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { Test } from './test.entity';

@Entity('test_attempts')
@Unique(['userId', 'testId', 'attemptNumber'])
export class TestAttempt extends BaseEntity {
  @Column({ name: 'user_id', type: 'uuid' })
  @Index('idx_test_attempts_user_id')
  userId!: string;

  @Column({ name: 'test_id', type: 'uuid' })
  @Index('idx_test_attempts_test_id')
  testId!: string;

  @Column({ name: 'score', type: 'int', default: 0 })
  score!: number;

  @Column({ name: 'passed', type: 'boolean', default: false })
  passed!: boolean;

  @Column({ name: 'attempt_number', type: 'int', default: 1 })
  attemptNumber!: number;

  // За SQLite съвместимост използваме 'simple-json' вместо 'jsonb'
  @Column({ name: 'answers_data', type: 'simple-json', nullable: true })
  answersData!: Record<string, unknown> | null;

  @Column({ name: 'started_at', type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  startedAt!: Date;

  @Column({ name: 'completed_at', type: 'datetime', nullable: true })
  completedAt!: Date | null;

  // Relationships
  @ManyToOne(() => User, (user: User) => user.testAttempts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @ManyToOne(() => Test, (test: Test) => test.attempts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'test_id' })
  test!: Test;
}
