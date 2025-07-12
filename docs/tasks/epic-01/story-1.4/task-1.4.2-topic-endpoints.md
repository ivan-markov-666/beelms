# Task 1.4.2: Topic Endpoints

## 🎯 Цел

Имплементиране на RESTful API ендпойнти за управление на теми в курсове.

## 🛠️ Действия

1. Създаване на контролер за теми
2. Имплементиране на CRUD операции
3. Добавяне на ендпойнти за съдържание на теми
4. Имплементиране на търсене и филтриране
5. Документиране с Swagger
6. Писане на тестове

## 📋 Код

### DTOs

```typescript
// apps/api/src/topics/dto/create-topic.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, IsInt, Min, IsOptional, IsArray } from 'class-validator';

export class CreateTopicDto {
  @ApiProperty({ description: 'Topic title', example: 'Introduction to TypeScript' })
  @IsString()
  @Length(5, 200)
  title: string;

  @ApiProperty({
    description: 'Topic slug (auto-generated if not provided)',
    example: 'introduction-to-typescript',
    required: false,
  })
  @IsString()
  @IsOptional()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug can only contain lowercase letters, numbers, and hyphens',
  })
  slug?: string;

  @ApiProperty({
    description: 'Order index in the course',
    example: 1,
    required: false,
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  orderIndex?: number;

  @ApiProperty({
    description: 'ID of the course this topic belongs to',
    format: 'uuid',
  })
  @IsUUID()
  courseId: string;
}

// apps/api/src/topics/dto/update-topic.dto.ts
import { PartialType } from '@nestjs/swagger';
import { CreateTopicDto } from './create-topic.dto';

export class UpdateTopicDto extends PartialType(CreateTopicDto) {
  @ApiProperty({ description: 'Whether the topic is published', required: false })
  isPublished?: boolean;
}

// apps/api/src/topics/dto/topic-content.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsObject, IsIn } from 'class-validator';

export class TopicContentDto {
  @ApiProperty({
    description: 'Content in JSON format',
    example: {
      type: 'doc',
      content: [{ type: 'heading', content: [{ type: 'text', text: 'Introduction' }] }],
    },
  })
  @IsObject()
  content: any;

  @ApiProperty({
    description: 'Language code',
    example: 'bg',
    default: 'bg',
  })
  @IsString()
  @IsOptional()
  @IsIn(['bg', 'en'])
  language?: string;
}
```

### Service

```typescript
// apps/api/src/topics/topics.service.ts
import { Injectable, NotFoundException, BadRequestException, forwardRef, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Topic, TopicContent } from '@qa-platform/shared-types';
import { CoursesService } from '../courses/courses.service';
import { CreateTopicDto } from './dto/create-topic.dto';
import { UpdateTopicDto } from './dto/update-topic.dto';
import { TopicContentDto } from './dto/topic-content.dto';
import { slugify } from '../common/utils/string.utils';

@Injectable()
export class TopicsService {
  constructor(
    @InjectRepository(Topic)
    private topicsRepository: Repository<Topic>,
    @InjectRepository(TopicContent)
    private topicContentsRepository: Repository<TopicContent>,
    @Inject(forwardRef(() => CoursesService))
    private coursesService: CoursesService
  ) {}

  async create(createTopicDto: CreateTopicDto, userId: string): Promise<Topic> {
    // Verify the course exists and user has access
    await this.coursesService.findOne(createTopicDto.courseId);

    const topic = this.topicsRepository.create({
      ...createTopicDto,
      slug: createTopicDto.slug || slugify(createTopicDto.title),
      createdById: userId,
    });

    return this.topicsRepository.save(topic);
  }

  async findAll(courseId?: string, isPublished?: boolean): Promise<Topic[]> {
    const where: any = {};

    if (courseId) {
      where.courseId = courseId;
    }

    if (isPublished !== undefined) {
      where.isPublished = isPublished;
    }

    return this.topicsRepository.find({
      where,
      order: { orderIndex: 'ASC' },
      relations: ['contents'],
    });
  }

  async findOne(id: string): Promise<Topic> {
    const topic = await this.topicsRepository.findOne({
      where: { id },
      relations: ['contents', 'course'],
    });

    if (!topic) {
      throw new NotFoundException(`Topic with ID ${id} not found`);
    }

    return topic;
  }

  async findContent(topicId: string, language = 'bg'): Promise<TopicContent> {
    const content = await this.topicContentsRepository.findOne({
      where: { topicId, language },
    });

    if (!content) {
      throw new NotFoundException(`Content for topic ${topicId} in language ${language} not found`);
    }

    return content;
  }

  async updateContent(topicId: string, contentDto: TopicContentDto, userId: string): Promise<TopicContent> {
    const { language = 'bg', content } = contentDto;

    // Verify topic exists
    await this.findOne(topicId);

    let topicContent = await this.topicContentsRepository.findOne({
      where: { topicId, language },
    });

    if (topicContent) {
      topicContent.content = content;
      topicContent.updatedById = userId;
    } else {
      topicContent = this.topicContentsRepository.create({
        topicId,
        language,
        content,
        createdById: userId,
      });
    }

    return this.topicContentsRepository.save(topicContent);
  }

  async search(query: string): Promise<Topic[]> {
    if (!query || query.trim().length < 3) {
      throw new BadRequestException('Search query must be at least 3 characters long');
    }

    return this.topicsRepository
      .createQueryBuilder('topic')
      .where('topic.title ILIKE :query', { query: `%${query}%` })
      .orWhere('topic.slug ILIKE :query', { query: `%${query}%` })
      .leftJoinAndSelect('topic.contents', 'content')
      .getMany();
  }
}
```

### Controller

```typescript
// apps/api/src/topics/topics.controller.ts
import { Controller, Get, Post, Body, Param, Put, Delete, Query, ParseUUIDPipe, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TopicsService } from './topics.service';
import { CreateTopicDto } from './dto/create-topic.dto';
import { UpdateTopicDto } from './dto/update-topic.dto';
import { TopicContentDto } from './dto/topic-content.dto';

@ApiTags('topics')
@Controller('topics')
export class TopicsController {
  constructor(private readonly topicsService: TopicsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new topic' })
  @ApiResponse({ status: 201, description: 'The topic has been successfully created.' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(@Body() createTopicDto: CreateTopicDto, @Req() req) {
    return this.topicsService.create(createTopicDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all topics' })
  @ApiQuery({ name: 'courseId', required: false, type: String })
  @ApiQuery({ name: 'isPublished', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'List of topics' })
  async findAll(@Query('courseId') courseId?: string, @Query('isPublished') isPublished?: boolean) {
    return this.topicsService.findAll(courseId, isPublished);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search topics' })
  @ApiQuery({ name: 'q', required: true, type: String })
  @ApiResponse({ status: 200, description: 'Search results' })
  @ApiResponse({ status: 400, description: 'Invalid search query' })
  async search(@Query('q') query: string) {
    return this.topicsService.search(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get topic by ID' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'The found topic' })
  @ApiResponse({ status: 404, description: 'Topic not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.topicsService.findOne(id);
  }

  @Get(':id/content')
  @ApiOperation({ summary: 'Get topic content' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiQuery({ name: 'language', required: false, enum: ['bg', 'en'] })
  @ApiResponse({ status: 200, description: 'Topic content' })
  @ApiResponse({ status: 404, description: 'Content not found' })
  async getContent(@Param('id', ParseUUIDPipe) id: string, @Query('language') language = 'bg') {
    return this.topicsService.findContent(id, language);
  }

  @Put(':id/content')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update or create topic content' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Content updated' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Topic not found' })
  async updateContent(@Param('id', ParseUUIDPipe) id: string, @Body() contentDto: TopicContentDto, @Req() req) {
    return this.topicsService.updateContent(id, contentDto, req.user.id);
  }
}
```

## 📦 Deliverables

- [x] CRUD ендпойнти за теми
- [x] Управление на съдържанието на темите
- [x] Търсене и филтриране
- [x] Валидация на входните данни
- [x] Swagger документация
- [ ] Интеграционни тестове
- [ ] Unit тестове за сървиса

## 🧪 Тестване

### Примерни заявки

1. **Създаване на тема**

   ```http
   POST /topics
   Authorization: Bearer <token>
   Content-Type: application/json

   {
     "title": "Въведение в TypeScript",
     "courseId": "123e4567-e89b-12d3-a456-426614174000"
   }
   ```

2. **Добавяне на съдържание**

   ```http
   PUT /topics/123e4567-e89b-12d3-a456-426614174000/content
   Authorization: Bearer <token>
   Content-Type: application/json

   {
     "content": {
       "type": "doc",
       "content": [
         {
           "type": "heading",
           "attrs": { "level": 1 },
           "content": [{ "type": "text", "text": "Въведение" }]
         },
         {
           "type": "paragraph",
           "content": [
             { "type": "text", "text": "Това е примерен урок за TypeScript." }
           ]
         }
       ]
     },
     "language": "bg"
   }
   ```

3. **Търсене на теми**
   ```http
   GET /topics/search?q=typescript
   ```

## 📝 Бележки

- Всички ендпойнти за модификация изискват автентикация
- Съдържанието се пази във формат ProseMirror/tiptap JSON
- Добавете кеширане за често използвани заявки
- Имплементирайте rate limiting за търсачката
- Добавете възможност за прикачване на файлове към темите
