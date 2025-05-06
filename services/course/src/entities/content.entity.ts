import { BaseEntity } from '@shared/entities/base.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { Chapter } from './chapter.entity';

@Entity('contents')
export class Content extends BaseEntity {
  @Column({ name: 'chapter_id' })
  @Index('idx_content_chapter_id')
  chapterId: number;

  @ManyToOne(() => Chapter, (chapter) => chapter.contents, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'chapter_id' })
  chapter: Chapter;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ name: 'content_type', length: 50, default: 'text' })
  contentType: string;

  @Column({ default: 0 })
  order: number;
}
