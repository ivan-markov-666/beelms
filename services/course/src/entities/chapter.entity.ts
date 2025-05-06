import { BaseEntity } from '@shared/entities/base.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { Content } from './content.entity';
import { Course } from './course.entity';

@Entity('chapters')
export class Chapter extends BaseEntity {
  @Column({ name: 'course_id' })
  @Index('idx_chapter_course_id')
  courseId: number;

  @ManyToOne(() => Course, (course) => course.chapters, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'course_id' })
  course: Course;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ default: 0 })
  order: number;

  @OneToMany(() => Content, (content) => content.chapter)
  contents: Content[];
}
