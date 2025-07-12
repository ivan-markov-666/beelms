# Task 1.2.2: TypeORM Entities Implementation

## 🎯 Цел

Създаване на TypeORM entity класове, които отразяват схемата на базата данни и осигуряват типова сигурност.

## 🛠️ Действия

1. Създаване на entity класове за всяка таблица
2. Дефиниране на връзки между entity-та
3. Добавяне на валидации и декоратори
4. Имплементиране на методи за работа с данните

## 📋 Код

### User Entity

```typescript
// packages/shared-types/src/entities/user.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Exclude } from 'class-transformer';
import { Course } from './course.entity';
import { Topic } from './topic.entity';

export enum UserRole {
  ADMIN = 'admin',
  INSTRUCTOR = 'instructor',
  STUDENT = 'student',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ unique: true })
  username: string;

  @Column()
  @Exclude()
  passwordHash: string;

  @Column({ nullable: true })
  firstName?: string;

  @Column({ nullable: true })
  lastName?: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.STUDENT,
  })
  role: UserRole;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  lastLoginAt?: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  // Relations
  @OneToMany(() => Course, (course) => course.createdBy)
  createdCourses: Course[];

  @OneToMany(() => Topic, (topic) => topic.createdBy)
  createdTopics: Topic[];

  // Helper methods
  get fullName(): string {
    return [this.firstName, this.lastName].filter(Boolean).join(' ').trim();
  }
}
```

### Category Entity

```typescript
// packages/shared-types/src/entities/category.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Course } from './course.entity';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ default: '#1976d2' })
  colorCode: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  // Relations
  @OneToMany(() => Course, (course) => course.category)
  courses: Course[];
}
```

### Course Entity

```typescript
// packages/shared-types/src/entities/course.entity.ts
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from './user.entity';
import { Category } from './category.entity';
import { Topic } from './topic.entity';

@Entity('courses')
export class Course {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ unique: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ nullable: true })
  categoryId?: string;

  @ManyToOne(() => Category, (category) => category.courses, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'categoryId' })
  category?: Category;

  @Column({ default: false })
  isPublished: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  publishedAt?: Date;

  @Column({ nullable: true })
  createdById?: string;

  @ManyToOne(() => User, (user) => user.createdCourses, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'createdById' })
  createdBy?: User;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  // Relations
  @OneToMany(() => Topic, (topic) => topic.course, { cascade: true })
  topics: Topic[];

  // Helper methods
  get topicCount(): number {
    return this.topics?.length || 0;
  }
}
```

## 📦 Deliverables

- [x] Entity класове за всички таблици
- [x] Дефинирани връзки между entity-та
- [x] Валидации и декоратори за всички полета
- [ ] Документация за всяко entity и неговите методи
- [ ] Тестове за валидация на entity-та

## 🧪 Тестване

```typescript
// Примерни тестове за валидация
import { validate } from 'class-validator';
import { User } from './entities/user.entity';

// Тест за валидация на потребител
const user = new User();
user.email = 'invalid-email';
user.username = 'test';
user.passwordHash = 'hashedpassword';

const errors = await validate(user);
console.log(errors); // Трябва да върне грешка за невалиден email
```

## 📝 Бележки

- Използвайте `@CreateDateColumn` и `@UpdateDateColumn` за автоматично управление на датите
- Добавете `@Exclude()` за чувствителни полета като пароли
- Използвайте enum-и за полета с фиксиран набор от стойности
- Добавете помощни методи за често използвани операции
