import {
  Entity,
  PrimaryColumn,
  JoinColumn,
  ManyToOne,
  Column,
  BaseEntity as TypeOrmBaseEntity,
} from 'typeorm'
import { User } from './user.entity'
import { Topic } from './topic.entity'

/**
 * Junction table that tracks which user has completed which topic.
 * Composite primary key: (userId, topicId)
 */
@Entity('user_progress')
export class UserProgress extends TypeOrmBaseEntity {
  @PrimaryColumn('uuid', { name: 'user_id' })
  userId!: string

  @PrimaryColumn('uuid', { name: 'topic_id' })
  topicId!: string

  @Column({ name: 'completed_at', type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  completedAt!: Date

  /* Relations */
  @ManyToOne(() => User, (user) => user.progressRecords, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User

  @ManyToOne(() => Topic, (topic) => topic.progressRecords, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'topic_id' })
  topic!: Topic
}
