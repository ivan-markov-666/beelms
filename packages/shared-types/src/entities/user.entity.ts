import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Check, OneToMany } from 'typeorm';
import { Exclude } from 'class-transformer';
import { IsEmail, IsNotEmpty, Length, Matches, IsEnum, IsBoolean, IsOptional, IsDate } from 'class-validator';
import { UserRole } from './user-role.enum';
import { Topic } from './topic.entity';

/**
 * Entity для пользователей в системе
 * @class User
 */
@Entity('users')
export class User {
  /**
   * Уникальный идентификатор пользователя
   */
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /**
   * Email пользователя, используется для аутентификации
   */
  @Column({ unique: true })
  @IsEmail({}, { message: 'Невалиден имейл формат' })
  @IsNotEmpty({ message: 'Имейлът е задължителен' })
  email!: string;

  /**
   * Уникальное имя пользователя
   */
  @Column({ unique: true })
  @Length(3, 30, { message: 'Потребителското име трябва да е между 3 и 30 символа' })
  @Matches(/^[a-zA-Z0-9_-]+$/, { message: 'Разрешени са само латински букви, цифри, тире и долна черта' })
  username!: string;

  /**
   * Хеш пароля, никогда не возвращается в API ответах
   */
  @Column()
  @IsNotEmpty({ message: 'Паролата е задължителна' })
  @Exclude()
  passwordHash!: string;

  /**
   * Имя пользователя (необязательное)
   */
  @Column({ nullable: true })
  @IsOptional()
  @Length(1, 50, { message: 'Името трябва да е между 1 и 50 символа' })
  firstName?: string;

  /**
   * Фамилия пользователя (необязательное)
   */
  @Column({ nullable: true })
  @IsOptional()
  @Length(1, 50, { message: 'Фамилията трябва да е между 1 и 50 символа' })
  lastName?: string;

  /**
   * Роль пользователя в системе
   * Используем varchar для SQLite совместимости вместо enum
   */
  @Column({
    type: 'varchar', // Для SQLite совместимости используем varchar вместо enum
    default: UserRole.STUDENT,
  })
  @Check(`"role" IN ('admin', 'instructor', 'student')`) // Добавляем Check constraint вместо enum
  @IsEnum(UserRole)
  role!: UserRole;

  /**
   * Активирован ли аккаунт пользователя
   */
  @Column({ default: true })
  @IsBoolean()
  isActive!: boolean;

  /**
   * Предпочитаемый язык пользователя
   */
  @Column({ type: 'varchar', length: 2, default: 'bg' })
  @Check(`"preferredLanguage" IN ('bg', 'en', 'de')`)
  preferredLanguage!: string;

  /**
   * Дата и время последней авторизации
   */
  @Column({ type: 'datetime', nullable: true }) // Используем datetime для SQLite совместимости
  @IsOptional()
  @IsDate()
  lastLoginAt?: Date;

  /**
   * Дата и время создания записи
   */
  @CreateDateColumn({ type: 'datetime' }) // Используем datetime для SQLite совместимости
  createdAt!: Date;

  /**
   * Дата и время последнего обновления записи
   */
  @UpdateDateColumn({ type: 'datetime' }) // Используем datetime для SQLite совместимости
  updatedAt!: Date;

  /**
   * Возвращает полное имя пользователя
   * @returns {string} форматированное полное имя
   */
  get fullName(): string {
    return [this.firstName, this.lastName].filter(Boolean).join(' ').trim();
  }

  /**
   * Проверяет, имеет ли пользователь определенную роль
   * @param role - роль, которую проверяем
   * @returns {boolean} true если пользователь имеет роль
   */
  hasRole(role: UserRole): boolean {
    return this.role === role;
  }

  /**
   * Проверяет, является ли пользователь администратором
   * @returns {boolean} true если пользователь администратор
   */
  isAdmin(): boolean {
    return this.role === UserRole.ADMIN;
  }

  /**
   * Проверяет, является ли пользователь инструктором
   * @returns {boolean} true если пользователь инструктор
   */
  isInstructor(): boolean {
    return this.role === UserRole.INSTRUCTOR;
  }

  /**
   * Темы, созданные пользователем (relation)
   */
  @OneToMany(() => Topic, (topic) => topic.createdBy)
  createdTopics!: Topic[];
}
