import { BaseEntity } from './base.entity'
import { Test } from './test.entity'
export declare class Question extends BaseEntity {
  text: string
  options: string[]
  correctAnswerIndex: number
  test: Test
}
