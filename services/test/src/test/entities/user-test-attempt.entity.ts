import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Test } from './test.entity';
import { UserAnswer } from './user-answer.entity';

@Entity('user_test_attempts')
export class UserTestAttempt {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  user_id: number;

  @Column()
  test_id: number;

  @Column()
  score: number;

  @Column()
  passed: boolean;

  @Column()
  time_spent: number;

  @Column({ default: 'in_progress' })
  status: string;

  @CreateDateColumn()
  started_at: Date;

  @Column({ nullable: true, type: 'timestamp' })
  completed_at: Date;

  @ManyToOne(() => Test, (test) => test.attempts)
  @JoinColumn({ name: 'test_id' })
  test: Test;

  @OneToMany(() => UserAnswer, (userAnswer) => userAnswer.attempt)
  answers: UserAnswer[];
}
