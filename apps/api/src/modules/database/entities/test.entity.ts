import { Column, Entity, ManyToOne, OneToMany, OneToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Topic } from './topic.entity';
import { Question } from './question.entity';
import { TestAttempt } from './test-attempt.entity';
import { User } from './user.entity';

@Entity('tests')
export class Test extends BaseEntity {
  @Column({ name: 'topic_id', type: 'uuid' })
  @Index('idx_tests_topic_id')
  topicId!: string;

  @Column({ length: 255 })
  title!: string;

  @Column({ name: 'passing_percentage', type: 'int', default: 70 })
  passingPercentage!: number;

  @Column({ name: 'max_attempts', type: 'int', default: 3 })
  maxAttempts!: number;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdById!: string | null;

  // Relationships
  @OneToOne(() => Topic, (topic: Topic) => topic.test, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'topic_id' })
  topic!: Topic;

  @OneToMany(() => Question, (question: Question) => question.test)
  questions!: Question[];

  @OneToMany(() => TestAttempt, (testAttempt: TestAttempt) => testAttempt.test)
  attempts!: TestAttempt[];

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'created_by' })
  createdBy!: User | null;
}
