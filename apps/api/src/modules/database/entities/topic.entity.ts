import { Column, Entity, ManyToOne, OneToMany, OneToOne, JoinColumn, Unique, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Category } from './category.entity';
import { TopicContent } from './topic-content.entity';
import { UserProgress } from './user-progress.entity';
import { Test } from './test.entity';
import { User } from './user.entity';

@Entity('topics')
@Unique(['categoryId', 'topicNumber'])
export class Topic extends BaseEntity {
  @Column({ name: 'category_id', type: 'uuid' })
  @Index('idx_topics_category_id')
  categoryId!: string;

  @Column({ name: 'topic_number', type: 'int' })
  topicNumber!: number;

  @Column({ length: 255 })
  name!: string;

  @Column({ length: 255, unique: true })
  slug!: string;

  @Column({ name: 'estimated_reading_time', type: 'int', default: 5 })
  estimatedReadingTime!: number;

  @Column({ name: 'is_published', type: 'boolean', default: false })
  isPublished!: boolean;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdById!: string | null;

  // Relationships
  @ManyToOne(() => Category, (category: Category) => category.topics, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'category_id' })
  category!: Category;

  @OneToMany(() => TopicContent, (topicContent: TopicContent) => topicContent.topic)
  content!: TopicContent[];

  @OneToOne(() => Test, (test: Test) => test.topic)
  test!: Test;

  @OneToMany(() => UserProgress, (userProgress: UserProgress) => userProgress.topic)
  userProgress!: UserProgress[];

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'created_by' })
  createdBy!: User | null;
}
