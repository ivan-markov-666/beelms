import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Test } from './test.entity';
import { UserAnswer } from './user-answer.entity';

@Entity('questions')
export class Question {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  test_id: number;

  @Column()
  question_text: string;

  @Column()
  question_type: string;

  @Column('jsonb')
  options: Record<string, any>;

  @Column('jsonb')
  correct_answers: Record<string, any>;

  @Column()
  points: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => Test, (test) => test.questions)
  @JoinColumn({ name: 'test_id' })
  test: Test;

  @OneToMany(() => UserAnswer, (userAnswer) => userAnswer.question)
  userAnswers: UserAnswer[];
}
