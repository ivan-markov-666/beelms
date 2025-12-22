import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('analytics_sessions')
@Index(['visitorId', 'lastSeenAt'])
export class AnalyticsSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'visitor_id', type: 'varchar', length: 64 })
  visitorId: string;

  @Column({ name: 'started_at', type: 'timestamptz' })
  startedAt: Date;

  @Column({ name: 'last_seen_at', type: 'timestamptz' })
  lastSeenAt: Date;

  @Column({ type: 'varchar', length: 128, nullable: true })
  source: string | null;

  @Column({
    name: 'initial_path',
    type: 'varchar',
    length: 512,
    nullable: true,
  })
  initialPath: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
