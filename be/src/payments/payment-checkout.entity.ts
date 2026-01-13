import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export type PaymentCheckoutProvider = 'stripe' | 'paypal' | 'mypos' | 'revolut';

export type PaymentCheckoutStatus =
  | 'created'
  | 'completed'
  | 'cancelled'
  | 'failed';

@Entity('payment_checkouts')
export class PaymentCheckout {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'provider', type: 'varchar', length: 20 })
  provider: PaymentCheckoutProvider;

  @Column({ name: 'course_id', type: 'uuid' })
  courseId: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'external_order_id', type: 'varchar', length: 255 })
  externalOrderId: string;

  @Column({ name: 'status', type: 'varchar', length: 20, default: 'created' })
  status: PaymentCheckoutStatus;

  @Column({ name: 'amount_cents', type: 'integer' })
  amountCents: number;

  @Column({ name: 'currency', type: 'varchar', length: 3 })
  currency: string;

  @Column({
    name: 'mypos_trnref',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  myposTrnref: string | null;

  @Column({
    name: 'revolut_order_id',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  revolutOrderId: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
