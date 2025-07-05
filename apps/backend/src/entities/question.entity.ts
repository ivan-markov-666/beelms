import { Column, Entity, ManyToOne } from 'typeorm'
import { BaseEntity } from './base.entity'
import { Test } from './test.entity'

@Entity('questions')
export class Question extends BaseEntity {
  @Column({ type: 'text' })
  text!: string

  @Column({ type: 'simple-json' })
  options!: string[]

  @Column({ name: 'correct_answer_index' })
  correctAnswerIndex!: number

  /* Relations */
  @ManyToOne(() => Test, (test) => test.questions, { onDelete: 'CASCADE' })
  test!: Test
}
