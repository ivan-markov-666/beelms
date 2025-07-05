import { BaseEntity } from './base.entity'
import { Course } from './course.entity'
import { Test } from './test.entity'
import { UserProgress } from './user-progress.entity'
export declare class Topic extends BaseEntity {
  title: string
  content: string
  course: Course
  test: Test
  progressRecords: UserProgress[]
}
