import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { IsUUID, IsString, Length, IsBoolean, IsInt, Min } from 'class-validator';
import { Question } from './question.entity';

/**
 * Entity за възможен отговор (опция) към даден въпрос.
 */
@Entity('question_options')
@Index(['questionId', 'sortOrder'], { unique: true })
export class QuestionOption {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  @Index('idx_question_options_question_id')
  @IsUUID('all')
  questionId!: string;

  @Column({ type: 'text' })
  @IsString()
  @Length(1, 2000)
  optionText!: string;

  @Column({ default: false })
  @IsBoolean()
  isCorrect!: boolean;

  @Column({ type: 'int' })
  @IsInt()
  @Min(0)
  sortOrder!: number;

  @CreateDateColumn({ type: 'datetime' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt!: Date;

  // relations
  @ManyToOne(() => Question, (question) => question.options, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'questionId' })
  question!: Question;
}
