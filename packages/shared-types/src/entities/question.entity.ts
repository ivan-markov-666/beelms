import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
  Check,
} from 'typeorm';
import { IsInt, Min, Length, IsUUID, IsOptional, IsString, IsEnum } from 'class-validator';
import { Test } from './test.entity';
import { QuestionOption } from './question-option.entity';
import { User } from './user.entity';
import { QuestionType } from '../enums/question-type.enum';

/**
 * Entity, представляващо въпрос в даден тест.
 */
@Entity('questions')
@Check("question_type IN ('single','multiple')")
@Index(['testId', 'sortOrder'], { unique: true })
export class Question {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  @Index('idx_questions_test_id')
  @IsUUID('all')
  testId!: string;

  @Column({
    name: 'question_type',
    type: 'varchar',
    length: 10,
    default: QuestionType.SINGLE,
  })
  @IsEnum(QuestionType)
  questionType!: QuestionType;

  @Column({ type: 'text' })
  @IsString()
  @Length(1, 5000)
  questionText!: string;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  explanation?: string | null;

  @Column({ type: 'int' })
  @IsInt()
  @Min(0)
  sortOrder!: number;

  @Column({ type: 'uuid', nullable: true })
  @IsUUID('all')
  @IsOptional()
  createdById?: string | null;

  @CreateDateColumn({ type: 'datetime' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt!: Date;

  // Relations
  @ManyToOne(() => Test, (test) => test.questions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'testId' })
  test!: Test;

  @OneToMany(() => QuestionOption, (option) => option.question, { cascade: true })
  options!: QuestionOption[];

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'createdById' })
  createdBy?: User | null;
}
