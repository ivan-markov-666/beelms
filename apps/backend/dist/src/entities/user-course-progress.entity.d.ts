import { BaseEntity as TypeOrmBaseEntity } from 'typeorm'
import { User } from './user.entity'
import { Course } from './course.entity'
export declare class UserCourseProgress extends TypeOrmBaseEntity {
  userId: string
  courseId: string
  completedTopics: number
  totalTopics: number
  progressPercentage: number
  updatedAt: Date
  user: User
  course: Course
}
