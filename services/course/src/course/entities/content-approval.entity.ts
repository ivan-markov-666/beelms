import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  OneToOne,
} from 'typeorm';
import { Content } from './content.entity';

export enum ApprovalStatus {
  DRAFT = 'draft',
  PENDING_REVIEW = 'pending_review',
  CHANGES_REQUESTED = 'changes_requested',
  APPROVED = 'approved',
  PUBLISHED = 'published',
  REJECTED = 'rejected',
}

@Entity('content_approvals')
export class ContentApproval {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'enum', enum: ApprovalStatus, default: ApprovalStatus.DRAFT })
  status: ApprovalStatus;

  @Column({ type: 'text', nullable: true })
  reviewComments: string;

  @Column({ type: 'integer', nullable: true })
  reviewedBy: number | null;

  @Column({ type: 'timestamp', nullable: true })
  reviewedAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  publishedAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  scheduledPublishAt: Date | null;

  @OneToOne(() => Content, (content) => content.approval, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  content: Content;

  @Column()
  contentId: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
