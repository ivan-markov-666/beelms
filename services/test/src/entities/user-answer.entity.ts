import { BaseEntity } from '@shared/entities/base.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { Question } from './question.entity';
import { UserTestAttempt } from './user-test-attempt.entity';

@Entity('user_answers')
export class UserAnswer extends BaseEntity {
  @Column({ name: 'attempt_id' })
  @Index('idx_user_answers_attempt_id')
  attemptId: number;

  @ManyToOne(() => UserTestAttempt, (attempt) => attempt.answers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'attempt_id' })
  attempt: UserTestAttempt;

  @Column({ name: 'question_id' })
  @Index('idx_user_answers_question_id')
  questionId: number;

  @ManyToOne(() => Question, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'question_id' })
  question: Question;

  @Column({ name: 'selected_answers', type: 'jsonb' })
  selectedAnswers: any[];

  @Column({ name: 'is_correct', default: false })
  isCorrect: boolean;

  @Column({ name: 'points_earned', default: 0 })
  pointsEarned: number;
}
