import { BaseEntity } from './base.entity'
import { UserProgress } from './user-progress.entity'
import { UserCourseProgress } from './user-course-progress.entity'
export declare enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}
export declare class User extends BaseEntity {
  email: string
  password: string
  role: UserRole
  progressRecords: UserProgress[]
  courseProgressRecords: UserCourseProgress[]
}
