import { Column, Entity, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Topic } from './topic.entity';

@Entity('categories')
export class Category extends BaseEntity {
  @Column({ length: 255 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string;

  @Column({ name: 'color_code', length: 7, default: '#1976d2' })
  colorCode!: string;

  @Column({ name: 'icon_name', length: 50, default: 'book' })
  iconName!: string;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder!: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  // Relationships
  @OneToMany(() => Topic, (topic: Topic) => topic.category)
  topics!: Topic[];
}
