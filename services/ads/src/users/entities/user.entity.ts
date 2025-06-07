import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EncryptionTransformer } from '../../common/transformers/encryption.transformer';
import { ApiProperty, ApiHideProperty } from '@nestjs/swagger';

/**
 * Потребителска ентити с криптирана чувствителна информация
 * Демонстрира използването на EncryptionTransformer за автоматично криптиране на чувствителна информация в базата данни
 */
@Entity('users')
export class User {
  @ApiProperty({ description: 'Уникален идентификатор на потребителя' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Име на потребителя' })
  @Column()
  firstName: string;

  @ApiProperty({ description: 'Фамилия на потребителя' })
  @Column()
  lastName: string;

  @ApiProperty({ description: 'Имейл адрес на потребителя' })
  @Column({
    unique: true,
    transformer: new EncryptionTransformer(), // Криптиране на имейла
    comment: 'Криптиран имейл адрес',
  })
  email: string;

  @ApiProperty({ description: 'Телефонен номер на потребителя' })
  @Column({
    nullable: true,
    transformer: new EncryptionTransformer(), // Криптиране на телефонния номер
    comment: 'Криптиран телефонен номер',
  })
  phone: string;

  @ApiHideProperty()
  @Column({
    select: false, // Не се извлича по подразбиране от базата данни
  })
  password: string; // Паролата не се криптира тук, а се хешира чрез bcrypt

  @ApiProperty({ description: 'Адрес на потребителя' })
  @Column({
    nullable: true,
    transformer: new EncryptionTransformer(), // Криптиране на адреса
    comment: 'Криптиран физически адрес',
  })
  address: string;

  @ApiProperty({ description: 'Дали потребителят е активиран' })
  @Column({ default: false })
  isActive: boolean;

  @ApiProperty({ description: 'Дата на създаване на записа' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'Дата на последна промяна' })
  @UpdateDateColumn()
  updatedAt: Date;
}
