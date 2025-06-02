import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Advertisement } from './advertisement.entity';

@Entity('user_ad_views')
export class UserAdView {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'ad_id' })
  adId: number;

  @ManyToOne(() => Advertisement, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ad_id' })
  advertisement: Advertisement;

  @Column({ name: 'user_id', nullable: true })
  userId: string;

  @Column({ name: 'session_id' })
  sessionId: string;

  @Column({ default: false })
  clicked: boolean;

  @Column({ name: 'ip_address', nullable: true })
  ipAddress: string;

  @Column({ name: 'user_agent', nullable: true, type: 'text' })
  userAgent: string;

  @Column({ name: 'referrer', nullable: true })
  referrer: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
