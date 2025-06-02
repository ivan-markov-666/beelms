import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('advertisements')
export class Advertisement {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  description: string;

  @Column({ name: 'image_url' })
  imageUrl: string;

  @Column({ name: 'target_url' })
  targetUrl: string;

  @Column({ name: 'start_date' })
  startDate: Date;

  @Column({ name: 'end_date' })
  endDate: Date;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ default: 0 })
  impressions: number;

  @Column({ default: 0 })
  clicks: number;

  @Column({ name: 'display_location', default: 'sidebar' })
  displayLocation: string;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
