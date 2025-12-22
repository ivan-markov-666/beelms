import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('analytics_page_views_daily')
@Index(['viewDate', 'path', 'source'], { unique: true })
export class AnalyticsPageViewDaily {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'view_date', type: 'date' })
  viewDate: string;

  @Column({ type: 'varchar', length: 512 })
  path: string;

  @Column({ type: 'varchar', length: 128, default: 'direct' })
  source: string;

  @Column({ name: 'view_count', type: 'int', default: 0 })
  viewCount: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
