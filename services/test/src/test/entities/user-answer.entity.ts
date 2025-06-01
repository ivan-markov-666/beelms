import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Question } from './question.entity';
import { UserTestAttempt } from './user-test-attempt.entity';

@Entity('user_answers')
export class UserAnswer {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  attempt_id: number;

  @Column()
  question_id: number;

  @Column('jsonb')
  selected_answers: Record<string, any>;

  @Column()
  is_correct: boolean;

  @Column()
  points_earned: number;

  @Column({ default: 0 })
  time_spent_seconds: number;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => UserTestAttempt, (attempt) => attempt.answers)
  @JoinColumn({ name: 'attempt_id' })
  attempt: UserTestAttempt;

  @ManyToOne(() => Question, (question) => question.userAnswers)
  @JoinColumn({ name: 'question_id' })
  question: Question;
}
