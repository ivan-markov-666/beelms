import { BaseEntity } from '@shared/entities/base.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { User } from './user.entity';

@Entity('password_resets')
export class PasswordReset extends BaseEntity {
  @Column({ name: 'user_id' })
  @Index('idx_password_reset_user_id')
  userId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ length: 255 })
  @Index('idx_password_reset_token')
  token: string;

  @Column({ default: false })
  used: boolean;

  @Column({ name: 'expires_at', type: 'timestamp' })
  expiresAt: Date;
}
