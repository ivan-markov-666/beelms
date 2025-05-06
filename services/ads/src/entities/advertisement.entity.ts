import { BaseEntity } from '@shared/entities/base.entity';
import { Column, Entity, Index, OneToMany } from 'typeorm';
import { UserAdView } from './user-ad-view.entity';

@Entity('advertisements')
export class Advertisement extends BaseEntity {
  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'image_url', length: 255 })
  imageUrl: string;

  @Column({ name: 'target_url', length: 255 })
  targetUrl: string;

  @Column({ name: 'start_date', type: 'timestamp' })
  @Index('idx_advertisement_dates')
  startDate: Date;

  @Column({ name: 'end_date', type: 'timestamp' })
  @Index('idx_advertisement_dates')
  endDate: Date;

  @Column({ name: 'is_active', default: true })
  @Index('idx_advertisement_is_active')
  isActive: boolean;

  @Column({ default: 0 })
  impressions: number;

  @Column({ default: 0 })
  clicks: number;

  @OneToMany(() => UserAdView, (view) => view.ad)
  views: UserAdView[];
}
