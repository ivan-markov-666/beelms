import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Content } from './content.entity';

export enum MediaType {
  IMAGE = 'image',
  VIDEO = 'video',
  DOCUMENT = 'document',
  AUDIO = 'audio',
  ATTACHMENT = 'attachment',
}

@Entity('media_files')
export class MediaFile {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'content_id', nullable: true })
  contentId: number;

  @ManyToOne(() => Content, (content) => content.mediaFiles, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'content_id' })
  content: Content;

  @Column()
  filename: string;

  @Column({ name: 'original_name' })
  originalName: string;

  @Column()
  path: string;

  @Column()
  url: string;

  @Column()
  size: number;

  @Column({ name: 'mime_type' })
  mimeType: string;

  @Column()
  extension: string;

  @Column({
    type: 'enum',
    enum: MediaType,
    default: MediaType.ATTACHMENT,
  })
  type: MediaType;

  @Column({ name: 'created_by' })
  createdBy: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
