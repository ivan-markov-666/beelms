import { Column, Entity, ManyToOne, OneToOne, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Course } from './course.entity';
import { Test } from './test.entity';
import { UserProgress } from './user-progress.entity';

@Entity('topics')
export class Topic extends BaseEntity {
  @Column()
  title!: string;

  @Column({ type: 'text' })
  content!: string; // Markdown

  /* Relations */
  @ManyToOne(() => Course, (course) => course.topics, {
    onDelete: 'CASCADE',
  })
  course!: Course;

  @OneToOne(() => Test, (test) => test.topic)
  test!: Test;

  @OneToMany(() => UserProgress, (progress) => progress.topic)
  progressRecords!: UserProgress[];
}
