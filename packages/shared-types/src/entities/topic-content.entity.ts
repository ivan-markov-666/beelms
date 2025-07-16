import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { IsUUID, IsString, Length, IsIn, IsNotEmpty } from 'class-validator';
import { Topic } from './topic.entity';
import { getFtsProvider } from '../providers/fts-provider';

/**
 * Localised content entity for Topic with FTS support.
 */
@Entity('topic_contents')
export class TopicContent {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  @IsUUID()
  topicId!: string;

  @ManyToOne(() => Topic, (topic) => topic.contents, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'topicId' })
  topic!: Topic;

  @Column({ length: 2 })
  @IsString()
  @Length(2, 2)
  @IsIn(['bg', 'en', 'de'], { message: 'Поддържаните езици са само bg, en и de' })
  languageCode!: string;

  @Column({ type: 'text' })
  @IsNotEmpty({ message: 'Съдържанието е задължително' })
  content!: string;

  @Column({ type: 'text', nullable: true })
  contentHtml?: string;

  // For SQLite we store JSON, for Postgres store tsvector
  @Column({
    type: process.env.DATABASE_TYPE?.toLowerCase().startsWith('postgres') ? 'tsvector' : 'simple-json',
    nullable: true,
  })
  searchVector?: Record<string, number> | (() => string);

  @CreateDateColumn({ type: 'datetime' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt!: Date;

  // ---------------------------------------------------------------------
  /** Hook: update search vector before insert/update */
  @BeforeInsert()
  @BeforeUpdate()
  updateSearchVector(): void {
    const ftsProvider = getFtsProvider();
    this.searchVector = ftsProvider.generateSearchVector({
      languageCode: this.languageCode,
      content: this.content,
      title: undefined,
    });
  }

  /** Convert markdown content to HTML (placeholder) */
  generateHtml(): string {
    // TODO: implement proper markdown to HTML conversion (e.g. using marked)
    return '';
  }

  /** Return short summary */
  getSummary(maxLength = 150): string {
    const plainText = this.content.replace(/#{1,6}\s?/g, '').replace(/\*\*/g, '');
    return plainText.length > maxLength ? `${plainText.substring(0, maxLength)}...` : plainText;
  }
}
