import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export type StripeWebhookEventStatus = 'received' | 'processed' | 'failed';

@Entity('stripe_webhook_events')
export class StripeWebhookEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'event_id', type: 'varchar', length: 255, unique: true })
  eventId: string;

  @Column({ name: 'event_type', type: 'varchar', length: 255 })
  eventType: string;

  @Column({ name: 'status', type: 'varchar', length: 20, default: 'received' })
  status: StripeWebhookEventStatus;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string | null;

  @Column({ name: 'processed_at', type: 'timestamptz', nullable: true })
  processedAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
