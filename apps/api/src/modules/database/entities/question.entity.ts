import { Column, Entity, ManyToOne, OneToMany, JoinColumn, Index, Unique } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Test } from './test.entity';
import { Answer } from './answer.entity';
import { User } from './user.entity';

export enum QuestionType {
  SINGLE = 'single',
  MULTIPLE = 'multiple',
}

@Entity('questions')
@Unique(['testId', 'sortOrder'])
export class Question extends BaseEntity {
  @Column({ name: 'test_id', type: 'uuid' })
  @Index('idx_questions_test_id')
  testId!: string;

  @Column({
    name: 'question_type',
    type: 'varchar',
    length: 10,
    default: QuestionType.SINGLE,
  })
  questionType!: QuestionType;

  @Column({ name: 'question_text', type: 'text' })
  questionText!: string;

  @Column({ type: 'text', nullable: true })
  explanation!: string | null;

  @Column({ name: 'sort_order', type: 'int' })
  sortOrder!: number;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdById!: string | null;

  // Relationships
  @ManyToOne(() => Test, (test: Test) => test.questions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'test_id' })
  test!: Test;

  @OneToMany(() => Answer, (answer: Answer) => answer.question)
  answers!: Answer[];

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'created_by' })
  createdBy!: User | null;
}
