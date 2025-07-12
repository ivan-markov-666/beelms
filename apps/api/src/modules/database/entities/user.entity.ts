import { Column, Entity, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { UserProgress } from './user-progress.entity';
import { TestAttempt } from './test-attempt.entity';

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

export enum Language {
  BG = 'bg',
  EN = 'en',
  DE = 'de',
}

@Entity('users')
export class User extends BaseEntity {
  @Column({ length: 255, unique: true })
  email!: string;

  @Column({ length: 50, unique: true, name: 'username' })
  username!: string;

  @Column({ name: 'password_hash', length: 255 })
  passwordHash!: string;

  @Column({ name: 'first_name', length: 100, nullable: true })
  firstName!: string | null;

  @Column({ name: 'last_name', length: 100, nullable: true })
  lastName!: string | null;

  @Column({
    type: 'varchar',
    length: 10,
    default: UserRole.USER,
  })
  role!: UserRole;

  @Column({ name: 'is_active', type: 'boolean', default: false })
  isActive!: boolean;

  @Column({
    name: 'preferred_language',
    type: 'varchar',
    length: 2,
    default: Language.BG,
  })
  preferredLanguage!: Language;

  @Column({ name: 'last_login_at', type: 'datetime', nullable: true })
  lastLoginAt!: Date | null;

  // Relationships
  @OneToMany(() => UserProgress, (userProgress: UserProgress) => userProgress.user)
  progress!: UserProgress[];

  @OneToMany(() => TestAttempt, (testAttempt: TestAttempt) => testAttempt.user)
  testAttempts!: TestAttempt[];
}
