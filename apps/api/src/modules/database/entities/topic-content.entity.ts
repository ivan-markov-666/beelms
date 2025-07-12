import { Column, Entity, ManyToOne, JoinColumn, Index, Unique } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Topic } from './topic.entity';
import { User } from './user.entity';

export enum LanguageCode {
  BG = 'bg',
  EN = 'en',
  DE = 'de',
}

@Entity('topic_content')
@Unique(['topicId', 'languageCode'])
export class TopicContent extends BaseEntity {
  @Column({ name: 'topic_id', type: 'uuid' })
  @Index('idx_topic_content_topic_id')
  topicId!: string;

  @Column({
    name: 'language_code',
    type: 'varchar',
    length: 2,
    default: LanguageCode.BG,
  })
  @Index('idx_topic_content_language')
  languageCode!: LanguageCode;

  @Column({ length: 255 })
  title!: string;

  @Column({ type: 'text' })
  content!: string;

  @Column({ name: 'meta_description', type: 'text', nullable: true })
  metaDescription!: string;

  // За SQLite съвместимост използваме text вместо tsvector
  // и ще имплементираме custom търсене с LIKE или FTS5 extension
  @Column({ name: 'search_vector', type: 'text', nullable: true })
  @Index('idx_topic_content_search', { synchronize: false })
  searchVector!: string;

  // Това поле се попълва автоматично чрез subscribers/triggers за PostgreSQL
  // За SQLite ще се генерира на application level

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdById!: string | null;

  // Relationships
  @ManyToOne(() => Topic, (topic: Topic) => topic.content, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'topic_id' })
  topic!: Topic;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'created_by' })
  createdBy!: User | null;
}
