import { Column, Entity, ManyToOne, OneToMany } from 'typeorm'
import { BaseEntity } from './base.entity'
import { Category } from './category.entity'
import { Topic } from './topic.entity'
import { UserCourseProgress } from './user-course-progress.entity'

@Entity('courses')
export class Course extends BaseEntity {
  @Column()
  title!: string

  @Column({ type: 'text' })
  description!: string

  /* Relations */
  @ManyToOne(() => Category, (category) => category.courses, {
    onDelete: 'CASCADE',
  })
  category!: Category

  @OneToMany(() => Topic, (topic) => topic.course)
  topics!: Topic[]

  @OneToMany(() => UserCourseProgress, (ucp) => ucp.course)
  courseProgressRecords!: UserCourseProgress[]
}
