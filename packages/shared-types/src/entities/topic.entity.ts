import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  JoinColumn,
  Unique,
  Index,
} from 'typeorm';
import { IsNotEmpty, IsUUID, IsInt, Min, IsString, Length, Matches, IsBoolean, IsOptional } from 'class-validator';
import { Category } from './category.entity';
import { TopicContent } from './topic-content.entity';
import { Test } from './test.entity';
import { User } from './user.entity';

/**
 * Topic entity representing a lesson within a category.
 */
@Entity('topics')
@Unique(['categoryId', 'topicNumber'])
export class Topic {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  @IsUUID()
  @Index('idx_topics_category_id')
  categoryId!: string;

  @ManyToOne(() => Category, (category) => category.topics, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'categoryId' })
  category!: Category;

  @Column()
  @IsInt()
  @Min(1, { message: 'Номерът на темата трябва да е положително число' })
  topicNumber!: number;

  @Column()
  @IsNotEmpty({ message: 'Името е задължително' })
  @IsString()
  @Length(2, 255, { message: 'Името трябва да е между 2 и 255 символа' })
  name!: string;

  @Column({ unique: true })
  @IsNotEmpty({ message: 'URL слъгът е задължителен' })
  @IsString()
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Слъгът може да съдържа само малки латински букви, цифри и тирета',
  })
  slug!: string;

  @Column({ default: 5 })
  @IsInt()
  @Min(1)
  estimatedReadingTime!: number;

  @Column({ default: false })
  @IsBoolean()
  isPublished!: boolean;

  @Column({ nullable: true })
  @IsUUID()
  @IsOptional()
  createdById?: string;

  @ManyToOne(() => User, (user) => user.createdTopics, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'createdById' })
  createdBy?: User;

  @OneToMany(() => TopicContent, (content) => content.topic, { cascade: true })
  contents!: TopicContent[];

  @OneToOne(() => Test, (test: Test) => test.topic)
  test!: Test;

  @CreateDateColumn({ type: 'datetime' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt!: Date;

  /** Helper: check if topic has content for language */
  hasContentInLanguage(languageCode: string): boolean {
    return this.contents?.some((c) => c.languageCode === languageCode) ?? false;
  }

  /** Helper: get content by language */
  getContentByLanguage(languageCode: string): TopicContent | undefined {
    return this.contents?.find((c) => c.languageCode === languageCode);
  }
}
