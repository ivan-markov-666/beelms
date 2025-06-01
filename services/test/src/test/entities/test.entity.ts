import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Question } from './question.entity';
import { UserTestAttempt } from './user-test-attempt.entity';

@Entity('tests')
export class Test {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  chapter_id: number;

  @Column()
  title: string;

  @Column()
  description: string;

  @Column()
  time_limit: number;

  @Column()
  passing_score: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => Question, (question) => question.test)
  questions: Question[];

  @OneToMany(() => UserTestAttempt, (attempt) => attempt.test)
  attempts: UserTestAttempt[];
}
