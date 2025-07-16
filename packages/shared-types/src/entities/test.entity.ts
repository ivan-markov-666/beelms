import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToOne,
  JoinColumn,
  OneToMany,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';
import { IsInt, Min, Max, Length, IsUUID, IsBoolean, IsOptional } from 'class-validator';
import { Topic } from './topic.entity';
import { Question } from './question.entity';
import { TestAttempt } from './test-attempt.entity';
import { User } from './user.entity';

/**
 * Entity представящо тест, асоцииран 1:1 с дадена тема.
 */
@Entity('tests')
export class Test {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // -----------------------------
  // Columns
  // -----------------------------
  @Column({ type: 'uuid' })
  @Index('idx_tests_topic_id')
  @IsUUID('all')
  topicId!: string;

  @Column({ length: 255 })
  @Length(1, 255)
  title!: string;

  @Column({ type: 'int', default: 70 })
  @IsInt()
  @Min(0)
  @Max(100)
  passingPercentage!: number;

  @Column({ type: 'int', default: 3 })
  @IsInt()
  @Min(1)
  maxAttempts!: number;

  @Column({ type: 'uuid', nullable: true })
  @IsUUID('all')
  @IsOptional()
  createdById?: string | null;

  @Column({ default: true })
  @IsBoolean()
  isActive!: boolean;

  @CreateDateColumn({ type: 'datetime' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt!: Date;

  // -----------------------------
  // Relations
  // -----------------------------
  @OneToOne(() => Topic, (topic) => topic.test, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'topicId' })
  topic!: Topic;

  @OneToMany(() => Question, (question: Question) => question.test, { cascade: true })
  questions!: Question[];

  @OneToMany(() => TestAttempt, (attempt) => attempt.test)
  attempts!: TestAttempt[];

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'createdById' })
  createdBy?: User | null;

  // -----------------------------
  // Helper methods
  // -----------------------------

  /**
   * Indicates if the provided percentage is a passing score for this test.
   * @param percent - процентът получен от потребителя
   */
  isPassed(percent: number): boolean {
    return percent >= this.passingPercentage;
  }
}
