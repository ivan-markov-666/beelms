import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export type BackupType = 'manual' | 'scheduled' | 'uploaded' | 'pre_restore';
export type BackupStorage = 'local' | 'remote' | 'both';
export type BackupStatus = 'ready' | 'failed' | 'deleted';
export type BackupDeletionReason = 'manual' | 'retention';

export type BackupEncryptionMeta = {
  alg: 'aes-256-gcm';
  saltB64: string;
  ivB64: string;
  tagB64: string;
  iterations: number;
};

@Entity('backups')
export class Backup {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  filename: string;

  @Column({ type: 'varchar', length: 1024 })
  path: string;

  @Column({ type: 'varchar', length: 20 })
  type: BackupType;

  @Column({ type: 'varchar', length: 20, default: 'local' })
  storage: BackupStorage;

  @Column({ name: 'size_bytes', type: 'bigint', default: 0 })
  sizeBytes: string;

  @Column({ type: 'varchar', length: 64 })
  sha256: string;

  @Column({ type: 'varchar', length: 20, default: 'ready' })
  status: BackupStatus;

  @Column({ name: 'encryption_meta', type: 'jsonb', nullable: true })
  encryptionMeta: BackupEncryptionMeta | null;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string | null;

  @Column({ name: 'created_by_user_id', type: 'uuid', nullable: true })
  createdByUserId: string | null;

  @Column({
    name: 'created_by_email',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  createdByEmail: string | null;

  @Column({ name: 'deleted_by_user_id', type: 'uuid', nullable: true })
  deletedByUserId: string | null;

  @Column({
    name: 'deleted_by_email',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  deletedByEmail: string | null;

  @Column({
    name: 'deleted_reason',
    type: 'varchar',
    length: 20,
    nullable: true,
  })
  deletedReason: BackupDeletionReason | null;

  @Column({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
