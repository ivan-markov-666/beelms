import { BaseEntity } from '@shared/entities/base.entity';
import { Column, Entity, OneToMany } from 'typeorm';
import { Chapter } from './chapter.entity';

@Entity('courses')
export class Course extends BaseEntity {
  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'cover_image_url', length: 255, nullable: true })
  coverImageUrl: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @OneToMany(() => Chapter, (chapter) => chapter.course)
  chapters: Chapter[];
}
