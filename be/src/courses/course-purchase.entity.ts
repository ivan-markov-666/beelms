import {
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Column,
} from 'typeorm';
import { Course } from './course.entity';
import { User } from '../auth/user.entity';

@Entity('course_purchases')
export class CoursePurchase {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'course_id', type: 'uuid' })
  courseId: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'source', type: 'varchar', length: 20, default: 'stripe' })
  source: string;

  @Column({ name: 'granted_by_user_id', type: 'uuid', nullable: true })
  grantedByUserId: string | null;

  @Column({
    name: 'grant_reason',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  grantReason: string | null;

  @Column({
    name: 'stripe_session_id',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  stripeSessionId: string | null;

  @Column({
    name: 'stripe_payment_intent_id',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  stripePaymentIntentId: string | null;

  @Column({ name: 'amount_cents', type: 'integer', nullable: true })
  amountCents: number | null;

  @Column({ name: 'currency', type: 'varchar', length: 3, nullable: true })
  currency: string | null;

  @Column({ name: 'revoked_at', type: 'timestamptz', nullable: true })
  revokedAt: Date | null;

  @Column({
    name: 'revoked_reason',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  revokedReason: string | null;

  @Column({
    name: 'revoked_event_id',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  revokedEventId: string | null;

  @ManyToOne(() => Course, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'course_id' })
  course: Course;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @CreateDateColumn({ name: 'purchased_at' })
  purchasedAt: Date;
}
