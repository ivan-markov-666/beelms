import { Chapter } from '@course/entities/chapter.entity';
import { BaseEntity } from '@shared/entities/base.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { Question } from './question.entity';

@Entity('tests')
export class Test extends BaseEntity {
  @Column({ name: 'chapter_id' })
  @Index('idx_test_chapter_id')
  chapterId: number;

  @ManyToOne(() => Chapter, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'chapter_id' })
  chapter: Chapter;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'time_limit', nullable: true })
  timeLimit: number | null;

  @Column({ name: 'passing_score', default: 60 })
  passingScore: number;

  @OneToMany(() => Question, (question) => question.test)
  questions: Question[];
}
