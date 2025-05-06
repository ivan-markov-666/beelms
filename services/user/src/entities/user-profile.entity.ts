import { BaseEntity } from '@shared/entities/base.entity';
import { Column, Entity, Index, JoinColumn, OneToOne } from 'typeorm';
import { User } from './user.entity';

@Entity('user_profiles')
export class UserProfile extends BaseEntity {
  @Column({ name: 'user_id', unique: true })
  @Index('idx_user_profile_user_id')
  userId: number;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'first_name', length: 100, nullable: true })
  firstName: string | null;

  @Column({ name: 'last_name', length: 100, nullable: true })
  lastName: string | null;

  @Column({ name: 'avatar_url', length: 255, nullable: true })
  avatarUrl: string | null;

  @Column({ type: 'jsonb', nullable: true })
  preferences: Record<string, any> | null;
}
