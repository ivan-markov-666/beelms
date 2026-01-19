import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

export type BackupLogAction =
  | 'backup_created'
  | 'backup_synced'
  | 'backup_sync_failed'
  | 'restore_started'
  | 'restore_completed'
  | 'restore_failed'
  | 'backup_deleted';

@Entity('backup_logs')
export class BackupLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'backup_id', type: 'uuid', nullable: true })
  backupId: string | null;

  @Column({ type: 'varchar', length: 30 })
  action: BackupLogAction;

  @Column({ name: 'actor_user_id', type: 'uuid', nullable: true })
  actorUserId: string | null;

  @Column({
    name: 'actor_email',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  actorEmail: string | null;

  @Column({ type: 'jsonb', nullable: true })
  details: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'occurred_at' })
  occurredAt: Date;
}
