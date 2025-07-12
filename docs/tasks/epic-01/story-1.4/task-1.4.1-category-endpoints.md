# Task 1.4.1: Category Endpoints

## 🎯 Цел

Имплементиране на RESTful API ендпойнти за управление на категории.

## 🛠️ Действия

1. Създаване на контролер за категории
2. Имплементиране на CRUD операции
3. Добавяне на валидация на входните данни
4. Документиране с Swagger
5. Писане на тестове

## 📋 Код

### DTOs

```typescript
// apps/api/src/categories/dto/create-category.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsHexColor, Length } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ description: 'Category name', example: 'Programming' })
  @IsString()
  @Length(2, 100)
  name: string;

  @ApiProperty({
    description: 'Category description',
    example: 'Programming related courses',
    required: false,
  })
  @IsString()
  @IsOptional()
  @Length(0, 1000)
  description?: string;

  @ApiProperty({
    description: 'Category color in hex format',
    example: '#2196F3',
    required: false,
  })
  @IsHexColor()
  @IsOptional()
  colorCode?: string;
}

// apps/api/src/categories/dto/update-category.dto.ts
import { PartialType } from '@nestjs/swagger';
import { CreateCategoryDto } from './create-category.dto';

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}

// apps/api/src/categories/dto/category-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class CategoryResponseDto {
  @ApiProperty({ description: 'Category ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ description: 'Category name', example: 'Programming' })
  name: string;

  @ApiProperty({
    description: 'Category description',
    example: 'Programming related courses',
    nullable: true,
  })
  description: string | null;

  @ApiProperty({ description: 'Category color in hex format', example: '#2196F3' })
  colorCode: string;

  @ApiProperty({ description: 'Date of creation', type: Date })
  createdAt: Date;

  @ApiProperty({ description: 'Date of last update', type: Date })
  updatedAt: Date;
}
```

### Service

```typescript
// apps/api/src/categories/categories.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '@qa-platform/shared-types';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private categoriesRepository: Repository<Category>
  ) {}

  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    const category = this.categoriesRepository.create(createCategoryDto);
    return this.categoriesRepository.save(category);
  }

  async findAll(): Promise<Category[]> {
    return this.categoriesRepository.find({
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Category> {
    const category = await this.categoriesRepository.findOne({ where: { id } });
    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }
    return category;
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto): Promise<Category> {
    const category = await this.findOne(id);
    Object.assign(category, updateCategoryDto);
    return this.categoriesRepository.save(category);
  }

  async remove(id: string): Promise<void> {
    const result = await this.categoriesRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }
  }

  async countCourses(id: string): Promise<number> {
    const category = await this.categoriesRepository.findOne({
      where: { id },
      relations: ['courses'],
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return category.courses?.length || 0;
  }
}
```

### Controller

```typescript
// apps/api/src/categories/categories.controller.ts
import { Controller, Get, Post, Body, Param, Put, Delete, Query, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { Category } from '@qa-platform/shared-types';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoryResponseDto } from './dto/category-response.dto';

@ApiTags('categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new category' })
  @ApiResponse({
    status: 201,
    description: 'The category has been successfully created.',
    type: CategoryResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async create(@Body() createCategoryDto: CreateCategoryDto): Promise<Category> {
    return this.categoriesService.create(createCategoryDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all categories' })
  @ApiQuery({
    name: 'includeCoursesCount',
    required: false,
    type: Boolean,
    description: 'Include count of courses in each category',
  })
  @ApiResponse({
    status: 200,
    description: 'List of categories',
    type: [CategoryResponseDto],
  })
  async findAll(@Query('includeCoursesCount') includeCoursesCount?: boolean): Promise<Category[]> {
    return this.categoriesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get category by ID' })
  @ApiResponse({
    status: 200,
    description: 'The found category',
    type: CategoryResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Category> {
    return this.categoriesService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a category' })
  @ApiResponse({
    status: 200,
    description: 'The updated category',
    type: CategoryResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCategoryDto: UpdateCategoryDto
  ): Promise<Category> {
    return this.categoriesService.update(id, updateCategoryDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a category' })
  @ApiResponse({ status: 204, description: 'Category successfully deleted' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.categoriesService.remove(id);
  }
}
```

### Module

```typescript
// apps/api/src/categories/categories.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoriesService } from './categories.service';
import { CategoriesController } from './categories.controller';
import { Category } from '@qa-platform/shared-types';

@Module({
  imports: [TypeOrmModule.forFeature([Category])],
  controllers: [CategoriesController],
  providers: [CategoriesService],
  exports: [CategoriesService],
})
export class CategoriesModule {}
```

## 📦 Deliverables

- [x] CRUD ендпойнти за категории
- [x] Валидация на входните данни
- [x] Swagger документация
- [ ] Интеграционни тестове
- [ ] Unit тестове за сървиса
- [x] Грешки и HTTP статус кодове

## 🧪 Тестване

### Unit тестове за сървиса

```typescript
// apps/api/test/categories/categories.service.spec.ts
describe('CategoriesService', () => {
  let service: CategoriesService;
  let repository: Repository<Category>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        {
          provide: getRepositoryToken(Category),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
    repository = module.get<Repository<Category>>(getRepositoryToken(Category));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a category', async () => {
      const createDto = { name: 'Test Category' };
      const expected = { id: '1', ...createDto } as Category;

      jest.spyOn(repository, 'create').mockReturnValue(expected);
      jest.spyOn(repository, 'save').mockResolvedValue(expected);

      const result = await service.create(createDto);
      expect(result).toEqual(expected);
      expect(repository.create).toHaveBeenCalledWith(createDto);
    });
  });
});
```

### Интеграционни тестове

```typescript
// apps/api/test/categories/categories.e2e-spec.ts
describe('CategoriesController (e2e)', () => {
  let app: INestApplication;
  let repository: Repository<Category>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [Category],
          synchronize: true,
        }),
        CategoriesModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    repository = moduleFixture.get(getRepositoryToken(Category));

    await app.init();
  });

  afterEach(async () => {
    await repository.clear();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /categories', () => {
    it('should return an array of categories', async () => {
      const category = { name: 'Test Category' };
      await repository.save(repository.create(category));

      const { body } = await request(app.getHttpServer()).get('/categories').expect(200);

      expect(body).toHaveLength(1);
      expect(body[0]).toMatchObject(category);
    });
  });
});
```

## 📝 Бележки

- Всички ендпойнти изискват автентикация, освен GET заявките
- Добавете rate limiting за защита срещу злоупотреби
- Логвайте всички промени по категориите
- Добавете кеширане за често използвани заявки
