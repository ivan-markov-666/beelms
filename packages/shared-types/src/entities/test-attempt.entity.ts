import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, JoinColumn, Index } from 'typeorm';
import { IsUUID, IsInt, Min, Max, IsBoolean } from 'class-validator';
import { User } from './user.entity';
import { Test } from './test.entity';

/**
 * Represents a single attempt of a user taking a test.
 */
@Entity('test_attempts')
export class TestAttempt {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  @IsUUID('all')
  @Index('idx_test_attempts_test_id')
  testId!: string;

  @ManyToOne(() => Test, (t) => t.attempts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'testId' })
  test!: Test;

  @Column({ type: 'uuid' })
  @IsUUID('all')
  @Index('idx_test_attempts_user_id')
  userId!: string;

  @ManyToOne(() => User, (u) => u.testAttempts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  /** 1-based attempt number (first attempt == 1) */
  @Column({ type: 'int', default: 1 })
  @IsInt()
  @Min(1)
  attemptNumber!: number;

  /** Score in percent 0–100 */
  @Column({ type: 'int' })
  @IsInt()
  @Min(0)
  @Max(100)
  scorePercentage!: number;

  /** Whether the attempt passed the test */
  @Column({ default: false })
  @IsBoolean()
  passed!: boolean;

  @CreateDateColumn({ type: 'datetime' })
  createdAt!: Date;

  /** Helper: compute passed based on test.passingPercentage */
  evaluatePass(): void {
    if (this.test) {
      this.passed = this.scorePercentage >= this.test.passingPercentage;
    }
  }
}
