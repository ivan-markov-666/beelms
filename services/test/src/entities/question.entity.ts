import { BaseEntity } from '@shared/entities/base.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { Test } from './test.entity';

@Entity('questions')
export class Question extends BaseEntity {
  @Column({ name: 'test_id' })
  @Index('idx_question_test_id')
  testId: number;

  @ManyToOne(() => Test, (test) => test.questions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'test_id' })
  test: Test;

  @Column({ name: 'question_text', type: 'text' })
  questionText: string;

  @Column({ name: 'question_type', length: 50, default: 'single_choice' })
  questionType: string;

  @Column({ type: 'jsonb' })
  options: any[];

  @Column({ name: 'correct_answers', type: 'jsonb' })
  correctAnswers: any[];

  @Column({ default: 1 })
  points: number;
}
