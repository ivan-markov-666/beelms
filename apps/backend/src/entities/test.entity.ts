import { Column, Entity, OneToMany, OneToOne, JoinColumn } from 'typeorm'
import { BaseEntity } from './base.entity'
import { Topic } from './topic.entity'
import { Question } from './question.entity'

@Entity('tests')
export class Test extends BaseEntity {
  @Column()
  title!: string

  /* Relations */
  @OneToOne(() => Topic, (topic) => topic.test, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'topic_id' })
  topic!: Topic

  @OneToMany(() => Question, (question) => question.test)
  questions!: Question[]
}
