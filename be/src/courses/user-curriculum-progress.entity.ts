import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { User } from '../auth/user.entity';
import { CourseCurriculumItem } from './course-curriculum-item.entity';
import { Course } from './course.entity';

@Entity('user_curriculum_progress')
@Unique(['userId', 'curriculumItemId'])
export class UserCurriculumProgress {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'course_id', type: 'uuid' })
  courseId: string;

  @Column({ name: 'curriculum_item_id', type: 'uuid' })
  curriculumItemId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Course, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'course_id' })
  course: Course;

  @ManyToOne(() => CourseCurriculumItem, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'curriculum_item_id' })
  curriculumItem: CourseCurriculumItem;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
