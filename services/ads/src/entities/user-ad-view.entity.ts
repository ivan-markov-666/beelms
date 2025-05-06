import { User } from '@auth/entities/user.entity';
import { BaseEntity } from '@shared/entities/base.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { Advertisement } from './advertisement.entity';

@Entity('user_ad_views')
export class UserAdView extends BaseEntity {
  @Column({ name: 'user_id' })
  @Index('idx_user_ad_views_user_id')
  userId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'ad_id' })
  @Index('idx_user_ad_views_ad_id')
  adId: number;

  @ManyToOne(() => Advertisement, (ad) => ad.views, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ad_id' })
  ad: Advertisement;

  @Column({ default: false })
  clicked: boolean;

  @Column({ name: 'viewed_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  viewedAt: Date;
}
