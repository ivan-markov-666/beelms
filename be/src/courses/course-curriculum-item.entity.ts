import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Course } from './course.entity';

@Entity('course_curriculum_items')
export class CourseCurriculumItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'course_id', type: 'uuid' })
  courseId: string;

  @ManyToOne(() => Course, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'course_id' })
  course: Course;

  @Column({ name: 'item_type', type: 'varchar', length: 10 })
  itemType: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ name: 'order_index', type: 'integer' })
  order: number;

  @Column({ name: 'wiki_slug', type: 'varchar', length: 255, nullable: true })
  wikiSlug: string | null;

  @Column({ name: 'task_id', type: 'uuid', nullable: true })
  taskId: string | null;

  @Column({ name: 'quiz_id', type: 'uuid', nullable: true })
  quizId: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
