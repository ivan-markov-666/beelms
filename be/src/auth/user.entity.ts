import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ name: 'password_hash', type: 'varchar', length: 255 })
  passwordHash: string;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @Column({ name: 'token_version', type: 'integer', default: 0 })
  tokenVersion: number;

  @Column({ name: 'email_verified', type: 'boolean', default: false })
  emailVerified: boolean;

  @Column({
    name: 'email_verification_token',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  emailVerificationToken: string | null;

  @Column({
    name: 'email_verification_token_expires_at',
    type: 'timestamp with time zone',
    nullable: true,
  })
  emailVerificationTokenExpiresAt: Date | null;

  @Column({
    name: 'pending_email',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  pendingEmail: string | null;

  @Column({
    name: 'pending_email_verification_token',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  pendingEmailVerificationToken: string | null;

  @Column({
    name: 'pending_email_verification_token_expires_at',
    type: 'timestamp with time zone',
    nullable: true,
  })
  pendingEmailVerificationTokenExpiresAt: Date | null;

  @Column({
    name: 'email_change_verification_count',
    type: 'integer',
    default: 0,
  })
  emailChangeVerificationCount: number;

  @Column({
    name: 'email_change_verification_window_started_at',
    type: 'timestamp with time zone',
    nullable: true,
  })
  emailChangeVerificationWindowStartedAt: Date | null;

  @Column({
    name: 'reset_password_token',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  resetPasswordToken: string | null;

  @Column({
    name: 'reset_password_token_expires_at',
    type: 'timestamp with time zone',
    nullable: true,
  })
  resetPasswordTokenExpiresAt: Date | null;

  @Column({
    name: 'password_last_changed_at',
    type: 'timestamp with time zone',
    nullable: true,
  })
  passwordLastChangedAt: Date | null;

  @Column({
    name: 'gdpr_erasure_requested_at',
    type: 'timestamp with time zone',
    nullable: true,
  })
  gdprErasureRequestedAt: Date | null;

  @Column({
    name: 'gdpr_erasure_completed_at',
    type: 'timestamp with time zone',
    nullable: true,
  })
  gdprErasureCompletedAt: Date | null;

  @Column({
    name: 'last_export_requested_at',
    type: 'timestamp with time zone',
    nullable: true,
  })
  lastExportRequestedAt: Date | null;

  @Column({
    name: 'last_export_delivered_at',
    type: 'timestamp with time zone',
    nullable: true,
  })
  lastExportDeliveredAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
