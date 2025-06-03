import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Content } from './content.entity';

@Entity('content_versions')
export class ContentVersion {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  contentId: number;

  @Column()
  versionNumber: number;

  @Column('text')
  contentBody: string;

  @Column({ nullable: true })
  changeDescription: string;

  @Column({ nullable: true })
  createdBy: number;

  @ManyToOne(() => Content, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'contentId' })
  content: Content;

  @CreateDateColumn()
  createdAt: Date;
}
