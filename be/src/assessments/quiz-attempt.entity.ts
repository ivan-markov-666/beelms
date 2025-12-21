import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('quiz_attempts')
export class QuizAttempt {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'quiz_id', type: 'uuid' })
  quizId: string;

  @Column({ name: 'course_id', type: 'uuid' })
  courseId: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ type: 'integer' })
  score: number;

  @Column({ name: 'max_score', type: 'integer' })
  maxScore: number;

  @Column({ type: 'boolean' })
  passed: boolean;

  @Column({ type: 'jsonb' })
  answers: Array<{ questionId: string; optionIndex: number }>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
