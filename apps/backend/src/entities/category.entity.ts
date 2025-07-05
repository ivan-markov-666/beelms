import { Column, Entity, OneToMany } from 'typeorm'
import { BaseEntity } from './base.entity'
import { Course } from './course.entity'

@Entity('categories')
export class Category extends BaseEntity {
  @Column({ unique: true })
  name!: string

  /* Relations */
  @OneToMany(() => Course, (course) => course.category)
  courses!: Course[]
}
