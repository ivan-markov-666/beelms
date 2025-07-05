import { BaseEntity as TypeOrmBaseEntity } from 'typeorm'
export declare class SystemSetting extends TypeOrmBaseEntity {
  key: string
  value: string
  description?: string
  updatedAt: Date
}
