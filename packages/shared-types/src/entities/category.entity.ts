import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { IsNotEmpty, IsString, IsOptional, Length, Matches, IsInt, Min, IsBoolean } from 'class-validator';
import { Topic } from './topic.entity';

/**
 * Category entity representing the high-level grouping of topics.
 * Compatible with both SQLite (development/tests) and PostgreSQL (production).
 */
@Entity('categories')
export class Category {
  /** Primary key */
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** Category display name */
  @Column()
  @IsNotEmpty({ message: 'Името е задължително' })
  @Length(2, 100, { message: 'Името трябва да е между 2 и 100 символа' })
  name!: string;

  /** Optional longer description */
  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  /** HEX color for UI accents */
  @Column({ default: '#1976d2' })
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/i, {
    message: 'Цветът трябва да е валиден HEX код (напр. #1976d2)',
  })
  colorCode!: string;

  /** Icon name used in front-end */
  @Column({ default: 'book' })
  @IsString()
  iconName!: string;

  /** Position ordering */
  @Column({ default: 0 })
  @IsInt()
  @Min(0)
  sortOrder!: number;

  /** Whether the category is visible */
  @Column({ default: true })
  @IsBoolean()
  isActive!: boolean;

  @CreateDateColumn({ type: 'datetime' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt!: Date;

  // Relations ---------------------------------------------------------------
  @OneToMany(() => Topic, (topic: Topic) => topic.category)
  topics!: Topic[];

  /** Helper: return only published topics */
  getActiveTopics(): Topic[] {
    return this.topics?.filter((t) => t.isPublished) ?? [];
  }

  /** Helper: number of topics in category */
  get topicsCount(): number {
    return this.topics?.length ?? 0;
  }
}
