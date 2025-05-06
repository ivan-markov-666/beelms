import { BaseEntity } from '@shared/entities/base.entity';
import { Column, Entity, Index } from 'typeorm';

@Entity('users')
export class User extends BaseEntity {
  @Column({ length: 255, unique: true })
  @Index('idx_user_email')
  email: string;

  @Column({ name: 'password_hash', length: 255 })
  passwordHash: string;

  @Column({ length: 255 })
  salt: string;

  @Column({ length: 50, default: 'user' })
  role: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'failed_login_attempts', default: 0 })
  failedLoginAttempts: number;

  @Column({ name: 'last_login', nullable: true, type: 'timestamp' })
  lastLogin: Date | null;
}
