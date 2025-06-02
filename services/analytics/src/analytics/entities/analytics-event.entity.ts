import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('analytics_events')
export class AnalyticsEvent {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  eventType: string;

  @Column({ type: 'jsonb' })
  eventData: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}
