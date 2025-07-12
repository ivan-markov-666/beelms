import { Column, Entity, ManyToOne, JoinColumn, Index, Unique } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Question } from './question.entity';

@Entity('answers')
@Unique(['questionId', 'sortOrder'])
export class Answer extends BaseEntity {
  @Column({ name: 'question_id', type: 'uuid' })
  @Index('idx_answers_question_id')
  questionId!: string;

  @Column({ name: 'answer_text', type: 'text' })
  answerText!: string;

  @Column({ name: 'is_correct', type: 'boolean', default: false })
  isCorrect!: boolean;

  @Column({ name: 'sort_order', type: 'int' })
  sortOrder!: number;

  // Relationships
  @ManyToOne(() => Question, (question: Question) => question.answers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'question_id' })
  question!: Question;
}
