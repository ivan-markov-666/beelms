# Task 1.2.2: TypeORM Entities Implementation

## 🎯 Цел

Създаване на TypeORM entity класове, които отразяват схемата на базата данни от архитектурния документ и осигуряват типова сигурност, като осигурят съвместимост със SQLite за разработка и PostgreSQL за продукция.

## 🛠️ Действия

**Важно:** В архитектурния документ не се използва модел Course, а има директна връзка между Category и Topic. Моля, игнорирайте примера с Course entity и използвайте правилния модел данни, базиран на SQL схемата от архитектурния документ.

1. Създаване на следните entity класове според схемата описана в архитектурния документ:
   - User
   - Category
   - Topic
   - TopicContent (за многоезично съдържание с поддръжка на FTS)
   - Test
   - Question
   - QuestionOption
   - UserProgress
   - TestAttempt

2. Дефиниране на връзки между entity-та според диаграмата на базата данни

3. Адаптиране на типовете за SQLite съвместимост:
   - Замяна на `type: 'enum'` с `type: 'varchar'` + `@Check` ограничения
   - Замяна на `type: 'timestamptz'` с `type: 'datetime'`
   - Замяна на `type: 'jsonb'` с `type: 'simple-json'`
   - Реализиране на PostgreSQL FTS функционалност чрез подходяща абстракция

4. Добавяне на class-validator декоратори за валидация на всички полета

5. Добавяне на подходящи TypeORM индекси за оптимизиране на заявките

6. Имплементиране на полезни helper методи за всяко entity (детайли по-долу)

7. Документиране на всички класове и методи с JSDoc

8. Създаване на тестове за валидация на entity функционалностите

## 📋 Разделяне на задачата

За по-ефективна имплементация и тестване, задачата е разделена на 4 логични части:

### Част 1: Базови потребителски данни и свързана инфраструктура

**Файлове за имплементация:**

- `shared-types/src/entities/user.entity.ts` - Entity за потребителите
- `shared-types/src/entities/user-role.enum.ts` - Enum за потребителските роли
- `shared-types/src/providers/fts-provider.interface.ts` - Интерфейс за FTS функционалност
- `shared-types/src/providers/fts-provider.ts` - Factory функция за FTS
- `shared-types/src/providers/sqlite-fts-provider.ts` - SQLite имплементация на FTS
- `shared-types/src/providers/postgres-fts-provider.ts` - PostgreSQL имплементация на FTS

**Тестове:**

- `tests/unit/entities/user.entity.spec.ts` - Unit тестове за User entity

### Част 2: Модел на категории и теми

**Файлове за имплементация:**

- `shared-types/src/entities/category.entity.ts` - Entity за категориите
- `shared-types/src/entities/topic.entity.ts` - Entity за темите
- `shared-types/src/entities/topic-content.entity.ts` - Entity за съдържанието на темите с FTS поддръжка

**Тестове:**

- `tests/unit/entities/category.entity.spec.ts` - Unit тестове за категориите
- `tests/unit/entities/topic.entity.spec.ts` - Unit тестове за темите
- `tests/unit/entities/topic-content.entity.spec.ts` - Unit тестове за съдържанието
- `tests/integration/entities/content-categories-topics.spec.ts` - Интеграционни тестове за връзките

### Част 3: Тестове и въпроси

**Файлове за имплементация:**

- `shared-types/src/entities/test.entity.ts` - Entity за тестовете
- `shared-types/src/entities/question.entity.ts` - Entity за въпросите
- `shared-types/src/entities/question-option.entity.ts` - Entity за опциите на въпросите
- `shared-types/src/enums/question-type.enum.ts` - Enum за типовете въпроси

**Тестове:**

- `tests/unit/entities/test.entity.spec.ts`
- `tests/unit/entities/question.entity.spec.ts`
- `tests/unit/entities/question-option.entity.spec.ts`
- `tests/integration/entities/tests-questions-options.spec.ts` - Интеграционни тестове за връзките

### Част 4: Прогрес и завършване

**Файлове за имплементация:**

- `shared-types/src/entities/user-progress.entity.ts` - Entity за прогрес на потребителите
- `shared-types/src/entities/test-attempt.entity.ts` - Entity за опитите за тестове
- `shared-types/src/utils/test-database.utils.ts` - Помощни функции за тестване с бази данни

**Тестове:**

- `tests/unit/entities/user-progress.entity.spec.ts`
- `tests/unit/entities/test-attempt.entity.spec.ts`
- `tests/integration/entities/progress-tracking.spec.ts`
- `tests/integration/entities/full-model.spec.ts` - Пълен интеграционен тест на всички entities

За всяка част ще бъдат реализирани:

1. **SQLite съвместимост**:
   - Замяна на `type: 'enum'` с `type: 'varchar'` + `@Check` ограничения
   - Замяна на `type: 'timestamptz'` с `type: 'datetime'`
   - Замяна на `type: 'jsonb'` с `type: 'simple-json'`

2. **Валидация**:
   - Използване на class-validator декоратори
   - JSDoc документация на всички полета и методи

3. **Helper методи**:
   - Полезни методи за работа с данните
   - Getter методи за изчисляване на производни стойности

4. **Тестове**:
   - Unit тестове за всяко entity
   - Интеграционни тестове за връзките между entities
   - Интеграция с regression suite

## 📋 Код

### User Entity с коректни типове и SQLite съвместимост

```typescript
// packages/shared-types/src/entities/user.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany, Check } from 'typeorm';
import { Exclude } from 'class-transformer';
import { IsEmail, IsNotEmpty, Length, Matches, IsEnum, IsBoolean, IsOptional, IsDate } from 'class-validator';
import { Topic } from './topic.entity';

export enum UserRole {
  ADMIN = 'admin',
  INSTRUCTOR = 'instructor',
  STUDENT = 'student',
}

/**
 * Entity за потребителите в системата
 * @class User
 */
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  @IsEmail({}, { message: 'Невалиден имейл формат' })
  @IsNotEmpty({ message: 'Имейлът е задължителен' })
  email: string;

  @Column({ unique: true })
  @Length(3, 30, { message: 'Потребителското име трябва да е между 3 и 30 символа' })
  @Matches(/^[a-zA-Z0-9_-]+$/, { message: 'Разрешени са само латински букви, цифри, тире и долна черта' })
  username: string;

  @Column()
  @IsNotEmpty({ message: 'Паролата е задължителна' })
  @Exclude()
  passwordHash: string;

  @Column({ nullable: true })
  @IsOptional()
  @Length(1, 50, { message: 'Името трябва да е между 1 и 50 символа' })
  firstName?: string;

  @Column({ nullable: true })
  @IsOptional()
  @Length(1, 50, { message: 'Фамилията трябва да е между 1 и 50 символа' })
  lastName?: string;

  @Column({
    type: 'varchar', // За SQLite съвместимост използваме varchar вместо enum
    default: UserRole.STUDENT,
  })
  @Check(`"role" IN ('admin', 'instructor', 'student')`) // Добавяме Check constraint вместо enum
  @IsEnum(UserRole)
  role: UserRole;

  @Column({ default: true })
  @IsBoolean()
  isActive: boolean;

  @Column({ type: 'datetime', nullable: true }) // Използваме datetime за SQLite съвместимост
  @IsOptional()
  @IsDate()
  lastLoginAt?: Date;

  @CreateDateColumn({ type: 'datetime' }) // Използваме datetime за SQLite съвместимост
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime' }) // Използваме datetime за SQLite съвместимост
  updatedAt: Date;

  // Relations
  @OneToMany(() => Topic, (topic) => topic.createdBy)
  createdTopics: Topic[];

  /**
   * Връща пълното име на потребителя
   * @returns {string} форматирано пълно име
   */
  get fullName(): string {
    return [this.firstName, this.lastName].filter(Boolean).join(' ').trim();
  }

  /**
   * Проверява дали потребителят има определена роля
   * @param role - ролята, която проверяваме
   * @returns {boolean} true ако потребителят има ролята
   */
  hasRole(role: UserRole): boolean {
    return this.role === role;
  }

  /**
   * Проверява дали потребителят е администратор
   * @returns {boolean} true ако потребителят е администратор
   */
  isAdmin(): boolean {
    return this.role === UserRole.ADMIN;
  }
}
```

### Category Entity с коректни типове и валидация

```typescript
// packages/shared-types/src/entities/category.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { IsNotEmpty, IsString, IsOptional, Length, Matches, IsInt, Min } from 'class-validator';
import { Topic } from './topic.entity';

/**
 * Entity за категориите в системата
 * @class Category
 */
@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @IsNotEmpty({ message: 'Името е задължително' })
  @Length(2, 100, { message: 'Името трябва да е между 2 и 100 символа' })
  name: string;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Column({ default: '#1976d2' })
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'Цветът трябва да е валиден HEX код (напр. #1976d2)' })
  colorCode: string;

  @Column({ default: 'book' })
  @IsString()
  iconName: string;

  @Column({ default: 0 })
  @IsInt()
  @Min(0)
  sortOrder: number;

  @CreateDateColumn({ type: 'datetime' }) // Използваме datetime за SQLite съвместимост
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime' }) // Използваме datetime за SQLite съвместимост
  updatedAt: Date;

  // Relations
  @OneToMany(() => Topic, (topic) => topic.category)
  topics: Topic[];

  /**
   * Връща само публикуваните теми в категорията
   * @returns {Topic[]} Масив от публикувани теми
   */
  getActiveTopics(): Topic[] {
    return this.topics?.filter((topic) => topic.isPublished) || [];
  }

  /**
   * Връща броя на темите в категорията
   * @returns {number} Брой теми
   */
  get topicsCount(): number {
    return this.topics?.length || 0;
  }
}
```

### Topic Entity в съответствие с архитектурния документ

```typescript
// packages/shared-types/src/entities/topic.entity.ts
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { IsNotEmpty, IsUUID, IsInt, IsString, IsBoolean, Min, Length } from 'class-validator';
import { Category } from './category.entity';
import { TopicContent } from './topic-content.entity';
import { Test } from './test.entity';
import { User } from './user.entity';

/**
 * Entity за темите/лекциите в системата
 * @class Topic
 */
@Entity('topics')
export class Topic {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @IsUUID()
  categoryId: string;

  @ManyToOne(() => Category, (category) => category.topics, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  @Column()
  @IsInt()
  @Min(1, { message: 'Номерът на темата трябва да е положително число' })
  topicNumber: number;

  @Column()
  @IsNotEmpty({ message: 'Името е задължително' })
  @IsString()
  @Length(2, 255, { message: 'Името трябва да е между 2 и 255 символа' })
  name: string;

  @Column({ unique: true })
  @IsNotEmpty({ message: 'URL слъгът е задължителен' })
  @IsString()
  @Matches(/^[a-z0-9-]+$/, { message: 'Слъгът може да съдържа само малки латински букви, цифри и тирета' })
  slug: string;

  @Column({ default: 5 })
  @IsInt()
  @Min(1)
  estimatedReadingTime: number;

  @Column({ default: false })
  @IsBoolean()
  isPublished: boolean;

  @Column({ nullable: true })
  @IsUUID()
  @IsOptional()
  createdById?: string;

  @ManyToOne(() => User, (user) => user.createdTopics, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'createdById' })
  createdBy?: User;

  @OneToMany(() => TopicContent, (content) => content.topic, { cascade: true })
  contents: TopicContent[];

  @OneToOne(() => Test, (test) => test.topic)
  test: Test;

  @CreateDateColumn({ type: 'datetime' }) // Използваме datetime за SQLite съвместимост
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime' }) // Използваме datetime за SQLite съвместимост
  updatedAt: Date;

  /**
   * Проверява дали темата има съдържание на определен език
   * @param languageCode - код на езика (bg, en, de)
   * @returns {boolean} true ако има съдържание на този език
   */
  hasContentInLanguage(languageCode: string): boolean {
    return this.contents?.some((content) => content.languageCode === languageCode) || false;
  }

  /**
   * Връща съдържанието на определен език
   * @param languageCode - код на езика (bg, en, de)
   * @returns {TopicContent | undefined} съдържанието на темата на съответния език
   */
  getContentByLanguage(languageCode: string): TopicContent | undefined {
    return this.contents?.find((content) => content.languageCode === languageCode);
  }
}
```

### TopicContent Entity с поддръжка за FTS

```typescript
// packages/shared-types/src/entities/topic-content.entity.ts
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { IsNotEmpty, IsUUID, IsString, Length, IsIn } from 'class-validator';
import { Topic } from './topic.entity';
import { getFtsProvider } from '../providers/fts-provider';

/**
 * Entity за съдържанието на темите с поддръжка за FTS
 * @class TopicContent
 */
@Entity('topic_contents')
export class TopicContent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @IsUUID()
  topicId: string;

  @ManyToOne(() => Topic, (topic) => topic.contents, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'topicId' })
  topic: Topic;

  @Column({ length: 2 })
  @IsString()
  @Length(2, 2)
  @IsIn(['bg', 'en', 'de'], { message: 'Поддържаните езици са само bg, en и de' })
  languageCode: string;

  @Column({ type: 'text' })
  @IsNotEmpty({ message: 'Съдържанието е задължително' })
  content: string;

  @Column({ type: 'text', nullable: true })
  contentHtml?: string;

  // SQLite ще използва 'simple-json', а PostgreSQL ще използва 'tsvector'
  @Column({ type: process.env.DATABASE_TYPE === 'postgres' ? 'tsvector' : 'simple-json', nullable: true })
  searchVector?: any;

  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt: Date;

  /**
   * Преди запис/обновяване, актуализира search vector колоната
   */
  @BeforeInsert()
  @BeforeUpdate()
  updateSearchVector() {
    const ftsProvider = getFtsProvider();
    this.searchVector = ftsProvider.generateSearchVector(this);
  }

  /**
   * Конвертира Markdown съдържание в HTML
   * @returns {string} HTML съдържание
   */
  generateHtml(): string {
    // Имплементация за конвертиране на markdown в html
    return ''; // placeholder
  }

  /**
   * Връща кратко резюме на съдържанието
   * @param {number} maxLength - максимална дължина на резюмето
   * @returns {string} резюме на съдържанието
   */
  getSummary(maxLength: number = 150): string {
    const plainText = this.content.replace(/#{1,6}\s?/g, '').replace(/\*\*/g, '');
    return plainText.length > maxLength ? `${plainText.substring(0, maxLength)}...` : plainText;
  }
}
```

### Test Entity и Question Entity

```typescript
// packages/shared-types/src/entities/test.entity.ts
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  OneToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { IsNotEmpty, IsUUID, IsInt, IsString, Min, Max, IsOptional } from 'class-validator';
import { Topic } from './topic.entity';
import { Question } from './question.entity';
import { TestAttempt } from './test-attempt.entity';

/**
 * Entity за тестовете към темите
 * @class Test
 */
@Entity('tests')
export class Test {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @IsUUID()
  topicId: string;

  @OneToOne(() => Topic, (topic) => topic.test)
  @JoinColumn({ name: 'topicId' })
  topic: Topic;

  @Column()
  @IsNotEmpty({ message: 'Името е задължително' })
  @IsString()
  name: string;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Column({ default: 70 })
  @IsInt()
  @Min(0)
  @Max(100)
  passingScore: number;

  @Column({ default: 10 })
  @IsInt()
  @Min(1)
  timeLimit: number; // минути

  @OneToMany(() => Question, (question) => question.test, { cascade: true })
  questions: Question[];

  @OneToMany(() => TestAttempt, (attempt) => attempt.test)
  attempts: TestAttempt[];

  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt: Date;

  /**
   * Връща броя на въпросите в теста
   * @returns {number} брой въпроси
   */
  get questionCount(): number {
    return this.questions?.length || 0;
  }

  /**
   * Изчислява максималния брой точки, които могат да се получат в теста
   * @returns {number} максимален брой точки
   */
  get maxScore(): number {
    return this.questions?.reduce((total, question) => total + question.points, 0) || 0;
  }
}

// packages/shared-types/src/entities/question.entity.ts
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { IsNotEmpty, IsUUID, IsInt, IsString, Min, IsBoolean, IsEnum } from 'class-validator';
import { Test } from './test.entity';
import { QuestionOption } from './question-option.entity';

export enum QuestionType {
  SINGLE_CHOICE = 'single_choice',
  MULTIPLE_CHOICE = 'multiple_choice',
  TRUE_FALSE = 'true_false',
  TEXT = 'text',
}

/**
 * Entity за въпросите в тестовете
 * @class Question
 */
@Entity('questions')
export class Question {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @IsUUID()
  testId: string;

  @ManyToOne(() => Test, (test) => test.questions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'testId' })
  test: Test;

  @Column({ type: 'varchar' })
  @IsEnum(QuestionType)
  @Check(`"question_type" IN ('single_choice', 'multiple_choice', 'true_false', 'text')`) // Check constraint за SQLite
  questionType: QuestionType;

  @Column()
  @IsNotEmpty({ message: 'Текстът на въпроса е задължителен' })
  @IsString()
  text: string;

  @Column({ default: 1 })
  @IsInt()
  @Min(1)
  points: number;

  @Column({ default: false })
  @IsBoolean()
  isRequired: boolean;

  @OneToMany(() => QuestionOption, (option) => option.question, { cascade: true })
  options: QuestionOption[];

  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt: Date;

  /**
   * Проверява дали въпросът има правилен отговор
   * @returns {boolean} true ако въпросът има поне един правилен отговор
   */
  hasCorrectAnswer(): boolean {
    if (this.questionType === QuestionType.TEXT) return true;
    return this.options?.some((option) => option.isCorrect) || false;
  }

  /**
   * Връща списък с правилните опции
   * @returns {QuestionOption[]} масив от правилни опции
   */
  getCorrectOptions(): QuestionOption[] {
    return this.options?.filter((option) => option.isCorrect) || [];
  }
}
```

## 📦 Deliverables

- [ ] Entity класове за всички таблици от схемата на базата данни
- [ ] Дефинирани връзки между entity-та според архитектурния документ
- [ ] SQL-съвместими типове и декоратори за всички полета
- [ ] Валидации с class-validator за всички полета
- [ ] Документация (JSDoc) за всяко entity и неговите методи
- [ ] Тестове за валидация на entity-та
- [ ] Имплементация на абстрактния слой за FTS
- [ ] Миграционни скриптове за инициализиране на базата данни и FTS конфигурация

## 🧰 Очаквани Helper методи за Entity класове

### User Entity

- `fullName()` - връща пълното име на потребителя
- `hasRole(role: UserRole)` - проверява дали потребителят има определена роля
- `isAdmin()` - проверява дали потребителят е администратор
- `updateLastLogin()` - обновява датата на последно влизане

### Category Entity

- `getActiveTopics()` - връща само публикуваните теми в категорията
- `topicsCount` - връща броя на темите в категорията

### Topic Entity

- `hasContentInLanguage(languageCode: string)` - проверява дали темата има съдържание на определен език
- `getContentByLanguage(languageCode: string)` - връща съдържанието на темата на определен език
- `getSupportedLanguages()` - връща списък с поддържаните езици
- `hasTest()` - проверява дали темата има свързан тест

### TopicContent Entity

- `getSummary(maxLength: number)` - връща кратко резюме на съдържанието
- `generateHtml()` - конвертира Markdown съдържание в HTML
- `getReadingTime()` - изчислява приблизителното време за четене

### Test Entity

- `questionCount` - връща броя на въпросите в теста
- `maxScore` - изчислява максималния брой точки за теста
- `isPassingScore(score: number)` - проверява дали даден резултат е успешен

### Question Entity

- `hasCorrectAnswer()` - проверява дали въпросът има поне един правилен отговор
- `getCorrectOptions()` - връща списък с правилните опции

### TestAttempt Entity

- `calculateScore()` - изчислява получения брой точки
- `isPassing()` - проверява дали опитът е успешен
- `getRemainingTime()` - връща оставащото време за изпълнение

## 🧪 Тестване

### Валидационни тестове

```typescript
// packages/backend/test/entities/user.entity.spec.ts
import { validate } from 'class-validator';
import { User, UserRole } from '../../src/entities/user.entity';

describe('User Entity', () => {
  it('should validate a valid user', async () => {
    // Arrange
    const user = new User();
    user.email = 'valid@email.com';
    user.username = 'validuser';
    user.passwordHash = 'hashedpassword123';
    user.role = UserRole.STUDENT;

    // Act
    const errors = await validate(user);

    // Assert
    expect(errors.length).toBe(0);
  });

  it('should invalidate user with incorrect email format', async () => {
    // Arrange
    const user = new User();
    user.email = 'invalid-email';
    user.username = 'testuser';
    user.passwordHash = 'hashedpassword';

    // Act
    const errors = await validate(user);

    // Assert
    expect(errors.length).toBeGreaterThan(0);
    const emailErrors = errors.find((err) => err.property === 'email');
    expect(emailErrors).toBeDefined();
  });

  it('should invalidate user with too short username', async () => {
    // Arrange
    const user = new User();
    user.email = 'valid@email.com';
    user.username = 'ab'; // Името е прекалено късо
    user.passwordHash = 'hashedpassword';

    // Act
    const errors = await validate(user);

    // Assert
    expect(errors.length).toBeGreaterThan(0);
    const usernameErrors = errors.find((err) => err.property === 'username');
    expect(usernameErrors).toBeDefined();
  });
});
```

### Тестове за връзки между ентитита

```typescript
// packages/backend/test/entities/topic.entity.spec.ts
import { Topic } from '../../src/entities/topic.entity';
import { TopicContent } from '../../src/entities/topic-content.entity';
import { Category } from '../../src/entities/category.entity';

describe('Topic Entity Relations', () => {
  it('should correctly relate to category', () => {
    // Arrange
    const category = new Category();
    category.id = '123e4567-e89b-12d3-a456-426614174000';
    category.name = 'Категория за тестване';

    const topic = new Topic();
    topic.categoryId = category.id;
    topic.category = category;

    // Assert
    expect(topic.category).toBeDefined();
    expect(topic.category.id).toBe(category.id);
  });

  it('should manage content in multiple languages', () => {
    // Arrange
    const topic = new Topic();
    topic.id = '123e4567-e89b-12d3-a456-426614174000';

    const contentBG = new TopicContent();
    contentBG.topicId = topic.id;
    contentBG.languageCode = 'bg';
    contentBG.content = 'Съдържание на български';

    const contentEN = new TopicContent();
    contentEN.topicId = topic.id;
    contentEN.languageCode = 'en';
    contentEN.content = 'Content in English';

    topic.contents = [contentBG, contentEN];

    // Act & Assert
    expect(topic.contents.length).toBe(2);
    expect(topic.hasContentInLanguage('bg')).toBe(true);
    expect(topic.hasContentInLanguage('de')).toBe(false);
    expect(topic.getContentByLanguage('en')?.content).toBe('Content in English');
  });
});
```

### Тестване на FTS функционалност

```typescript
// packages/backend/test/providers/fts-provider.spec.ts
import { TopicContent } from '../../src/entities/topic-content.entity';
import { SqliteFtsProvider } from '../../src/providers/sqlite-fts-provider';
import { PostgresFtsProvider } from '../../src/providers/postgres-fts-provider';

describe('Full Text Search Providers', () => {
  describe('SQLite FTS Provider', () => {
    const sqliteProvider = new SqliteFtsProvider();

    it('should generate search vector for content', () => {
      // Arrange
      const content = new TopicContent();
      content.content = 'This is a test content with some keywords';
      content.languageCode = 'en';

      // Act
      const searchVector = sqliteProvider.generateSearchVector(content);

      // Assert
      expect(searchVector).toBeDefined();
      const parsedVector = JSON.parse(searchVector);
      expect(Array.isArray(parsedVector)).toBe(true);
      expect(parsedVector).toContain('test');
      expect(parsedVector).toContain('content');
      expect(parsedVector).toContain('keywords');
    });

    it('should create correct search query', () => {
      // Act
      const query = sqliteProvider.createSearchQuery('test', 'en');

      // Assert
      expect(query).toContain("MATCH 'test'");
      expect(query).toContain("language_code = 'en'");
    });
  });
});
```

### Тестване със SQLite in-memory база данни

```typescript
// packages/backend/test/setup-test-db.ts
import { createConnection, getConnection } from 'typeorm';
import { entities } from '../src/entities';

export const setupTestDb = async () => {
  // Създаваме in-memory SQLite база данни за тестове
  await createConnection({
    name: 'test',
    type: 'sqlite',
    database: ':memory:',
    entities: entities,
    synchronize: true,
    dropSchema: true,
    logging: false,
  });
};

export const closeTestDb = async () => {
  // Затваряме връзката след всеки тест
  const connection = getConnection('test');
  await connection.close();
};

// Примерна употреба в тестовия файл:
//
// describe('User Repository', () => {
//   beforeEach(async () => {
//     await setupTestDb();
//   });
//
//   afterEach(async () => {
//     await closeTestDb();
//   });
//
//   it('should create a user', async () => {
//     // тест логика
//   });
// });
```

## 📑 Бележки за SQL Съвместимост

- Използвайте `@CreateDateColumn` и `@UpdateDateColumn` с `type: 'datetime'` за автоматично управление на датите
- За enum полета използвайте `type: 'varchar'` с `@Check` ограничение вместо `type: 'enum'`
- За JSON полета използвайте `type: 'simple-json'` вместо `jsonb`
- За tsvector (PostgreSQL Full Text Search) използвайте `type: 'simple-json'` в SQLite
- Добавете `@Exclude()` за чувствителни полета като пароли
- Добавете helper методи за често използвани операции
- Винаги тествайте със SQLite in-memory база данни за локална разработка и тестване

### Конфигурация за SQLite in-memory тестване

```typescript
// packages/backend/test/config/typeorm-test-config.ts
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { entities } from '../../src/entities';

export const testDbConfig: TypeOrmModuleOptions = {
  type: 'sqlite',
  database: ':memory:',
  entities: entities,
  synchronize: true, // Винаги true за ин-мемори тестове
  dropSchema: true,
  logging: false,
};
```

## 📝 Допълнителни ресурси

- [TypeORM официална документация](https://typeorm.io/)
- [class-validator документация](https://github.com/typestack/class-validator)
- [PostgreSQL FTS документация](https://www.postgresql.org/docs/current/textsearch.html)
- [SQLite FTS5 документация](https://www.sqlite.org/fts5.html)

## 📌 Очаквана Имплементация на Full Text Search

За поддръжка на FTS в базата данни, трябва да се имплементира специална абстракция. По-долу е илюстриран детайлен подход за реализация:

### FTS Provider интерфейс и имплементации

```typescript
// packages/shared-types/src/providers/fts-provider.interface.ts
import { TopicContent } from '../entities/topic-content.entity';

/**
 * Интерфейс за провайдър на FTS функционалност
 */
export interface IFullTextSearchProvider {
  /**
   * Генерира search vector за съдържанието
   * @param content - съдържанието за което се генерира search vector
   */
  generateSearchVector(content: TopicContent): any;

  /**
   * Създава SQL заявка за търсене в съдържанието
   * @param searchTerm - термин за търсене
   * @param languageCode - език на търсене
   */
  createSearchQuery(searchTerm: string, languageCode?: string): string;

  /**
   * Създава миграция за FTS
   */
  createMigrationScript(): string;
}
```

### PostgreSQL Имплементация

```typescript
// packages/shared-types/src/providers/postgres-fts-provider.ts
import { TopicContent } from '../entities/topic-content.entity';
import { IFullTextSearchProvider } from './fts-provider.interface';

/**
 * PostgreSQL имплементация на FTS
 */
export class PostgresFtsProvider implements IFullTextSearchProvider {
  // Карта на езиците за PostgreSQL
  private languageMap = {
    bg: 'bulgarian',
    en: 'english',
    de: 'german',
  };

  generateSearchVector(content: TopicContent): any {
    // В реалната имплементация тази логика ще е в PostgreSQL trigger
    // Тук само връщаме placeholder
    return {};
  }

  createSearchQuery(searchTerm: string, languageCode = 'bg'): string {
    const lang = this.languageMap[languageCode] || 'english';
    return `
      SELECT tc.* FROM topic_contents tc
      WHERE tc.search_vector @@ plainto_tsquery('${lang}', '${searchTerm}')
      ORDER BY ts_rank(tc.search_vector, plainto_tsquery('${lang}', '${searchTerm}')) DESC
    `;
  }

  createMigrationScript(): string {
    return `
    -- Създаване на функция за обновяване на search_vector
    CREATE OR REPLACE FUNCTION update_topic_content_search_vector() RETURNS trigger AS $$
    BEGIN
      IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND (NEW.content <> OLD.content OR NEW.language_code <> OLD.language_code)) THEN
        -- Избираме правилния речник според езика
        CASE NEW.language_code
          WHEN 'bg' THEN
            NEW.search_vector = to_tsvector('bulgarian', COALESCE(NEW.content, ''));
          WHEN 'de' THEN
            NEW.search_vector = to_tsvector('german', COALESCE(NEW.content, ''));
          ELSE
            NEW.search_vector = to_tsvector('english', COALESCE(NEW.content, ''));
        END CASE;
      END IF;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    -- Създаване на тригер за автоматично обновяване
    CREATE TRIGGER trigger_update_topic_content_search_vector
    BEFORE INSERT OR UPDATE ON topic_contents
    FOR EACH ROW EXECUTE FUNCTION update_topic_content_search_vector();

    -- Създаване на GIN индекс за бързо търсене
    CREATE INDEX idx_topic_contents_search_vector ON topic_contents USING GIN(search_vector);
    `;
  }
}
```

### SQLite Имплементация

```typescript
// packages/shared-types/src/providers/sqlite-fts-provider.ts
import { TopicContent } from '../entities/topic-content.entity';
import { IFullTextSearchProvider } from './fts-provider.interface';

/**
 * SQLite имплементация на FTS (FTS5)
 */
export class SqliteFtsProvider implements IFullTextSearchProvider {
  generateSearchVector(content: TopicContent): any {
    // SQLite използва виртуални FTS таблици вместо search vector
    // Тук съхраняваме думите като JSON масив за индексиране
    const words = content.content
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ') // премахваме специални символи
      .split(/\s+/) // разделяме на думи
      .filter((word) => word.length > 2); // игнорираме много кратки думи

    // Съхраняваме като JSON, защото SQLite няма вграден tsvector тип
    return JSON.stringify(words);
  }

  createSearchQuery(searchTerm: string, languageCode = 'bg'): string {
    // В SQLite използваме FTS5 виртуална таблица
    return `
      SELECT tc.* FROM topic_contents tc
      JOIN topic_contents_fts fts ON tc.id = fts.id
      WHERE topic_contents_fts MATCH '${searchTerm}'
      AND tc.language_code = '${languageCode}'
    `;
  }

  createMigrationScript(): string {
    return `
    -- Създаване на виртуална FTS таблица
    CREATE VIRTUAL TABLE IF NOT EXISTS topic_contents_fts USING fts5(
      id UNINDEXED,
      content,
      content_html UNINDEXED,
      language_code UNINDEXED
    );

    -- Създаване на тригери за синхронизиране с основната таблица
    CREATE TRIGGER IF NOT EXISTS topic_contents_ai AFTER INSERT ON topic_contents BEGIN
      INSERT INTO topic_contents_fts(id, content, content_html, language_code)
      VALUES (new.id, new.content, new.content_html, new.language_code);
    END;

    CREATE TRIGGER IF NOT EXISTS topic_contents_ad AFTER DELETE ON topic_contents BEGIN
      DELETE FROM topic_contents_fts WHERE id = old.id;
    END;

    CREATE TRIGGER IF NOT EXISTS topic_contents_au AFTER UPDATE ON topic_contents BEGIN
      DELETE FROM topic_contents_fts WHERE id = old.id;
      INSERT INTO topic_contents_fts(id, content, content_html, language_code)
      VALUES (new.id, new.content, new.content_html, new.language_code);
    END;
    `;
  }
}
```

### Factory за избор на имплементация

```typescript
// packages/shared-types/src/providers/fts-provider.ts
import { IFullTextSearchProvider } from './fts-provider.interface';
import { PostgresFtsProvider } from './postgres-fts-provider';
import { SqliteFtsProvider } from './sqlite-fts-provider';

/**
 * Factory функция, която връща правилната имплементация според типа на базата данни
 * @returns {IFullTextSearchProvider} имплементация на FTS провайдър
 */
export function getFtsProvider(): IFullTextSearchProvider {
  // Използваме environment променливи за определяне на типа БД
  const dbType = process.env.DATABASE_TYPE || 'sqlite';

  if (dbType === 'postgres') {
    return new PostgresFtsProvider();
  }

  return new SqliteFtsProvider(); // по подразбиране връщаме SQLite имплементация
}
```
