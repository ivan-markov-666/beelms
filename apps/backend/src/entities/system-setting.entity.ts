import {
  Column,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
  BaseEntity as TypeOrmBaseEntity,
} from 'typeorm';

/**
 * Operational settings that can be updated at runtime via admin UI.
 * Stored as key-value pairs.
 */
@Entity('system_settings')
export class SystemSetting extends TypeOrmBaseEntity {
  @PrimaryColumn()
  key!: string;

  @Column({ type: 'text' })
  value!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
