import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('user_progress')
export class UserProgress {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column()
  chapterId: number;

  @Column({ nullable: true })
  contentId: number;

  @Column({ default: false })
  completed: boolean;

  @Column({ default: 0 })
  progressPercentage: number;

  @Column({ nullable: true })
  lastAccessed: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
