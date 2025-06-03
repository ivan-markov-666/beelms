import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  OneToOne,
} from 'typeorm';
import { Chapter } from './chapter.entity';
import { ContentVersion } from './content-version.entity';
import { ContentApproval } from './content-approval.entity';
import { MediaFile } from './media-file.entity';

export enum ContentType {
  TEXT = 'text',
  VIDEO = 'video',
  IMAGE = 'image',
  PDF = 'pdf',
  QUIZ = 'quiz',
  ASSIGNMENT = 'assignment',
}

@Entity('contents')
export class Content {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  chapterId: number;

  @Column()
  title: string;

  @Column('text')
  content: string;

  @Column({
    type: 'enum',
    enum: ContentType,
    default: ContentType.TEXT,
  })
  contentType: ContentType;

  @Column()
  order: number;

  @Column({ default: 1 })
  version: number;

  @Column({ default: false })
  isPublished: boolean;

  @Column({ nullable: true })
  publishedAt: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ nullable: true })
  createdBy: number;

  @Column({ nullable: true })
  updatedBy: number;

  @ManyToOne(() => Chapter, (chapter) => chapter.contents, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'chapterId' })
  chapter: Chapter;

  @OneToMany(() => ContentVersion, (contentVersion) => contentVersion.content, {
    cascade: true,
  })
  versions: ContentVersion[];

  @OneToOne(() => ContentApproval, (approval) => approval.content, {
    cascade: true,
    eager: true,
  })
  approval: ContentApproval;

  @OneToMany(() => MediaFile, (mediaFile) => mediaFile.content, {
    cascade: true,
  })
  mediaFiles: MediaFile[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
