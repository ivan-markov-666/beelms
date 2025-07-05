import { Column, Entity, OneToMany, Check } from 'typeorm';
import { BaseEntity } from './base.entity';
import { UserProgress } from './user-progress.entity';
import { UserCourseProgress } from './user-course-progress.entity';

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

@Entity('users')
export class User extends BaseEntity {
  @Column({ unique: true })
  email!: string;

  @Column()
  password!: string;

  @Column({ type: 'varchar', default: UserRole.USER, length: 20 })
  @Check(`role IN ('user', 'admin')`)
  role!: UserRole;

  /* Relations */
  @OneToMany(() => UserProgress, (progress) => progress.user, { cascade: true })
  progressRecords!: UserProgress[];

  @OneToMany(() => UserCourseProgress, (progress) => progress.user, { cascade: true })
  courseProgressRecords!: UserCourseProgress[];
}
