import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  JoinColumn,
  UpdateDateColumn,
  BaseEntity as TypeOrmBaseEntity,
} from 'typeorm';
import { User } from './user.entity';
import { Course } from './course.entity';

/**
 * Denormalised table for quick retrieval of a user's progress in a course.
 * Composite primary key: (userId, courseId)
 */
@Entity('user_course_progress')
export class UserCourseProgress extends TypeOrmBaseEntity {
  @PrimaryColumn('uuid', { name: 'user_id' })
  userId!: string;

  @PrimaryColumn('uuid', { name: 'course_id' })
  courseId!: string;

  @Column({ name: 'completed_topics', type: 'int', default: 0 })
  completedTopics!: number;

  @Column({ name: 'total_topics', type: 'int' })
  totalTopics!: number;

  @Column({ name: 'progress_percentage', type: 'int', default: 0 })
  progressPercentage!: number;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  /* Relations */
  @ManyToOne(() => User, (user) => user.courseProgressRecords, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @ManyToOne(() => Course, (course) => course.courseProgressRecords, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'course_id' })
  course!: Course;
}
