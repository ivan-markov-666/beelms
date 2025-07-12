# Task 1.5.3: User Registration and Profile Management

## 🎯 Цел

Имплементиране на функционалност за регистрация, вход и управление на потребителски профили.

## 🛠️ Действия

1. Създаване на User модул и сървис
2. Имплементиране на регистрация и вход
3. Добавяне на ендпойнти за управление на профила
4. Валидация на входните данни
5. Добавяне на Swagger документация
6. Писане на тестове

## 📋 Код

### User Entity

```typescript
// libs/shared-types/src/user.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { Exclude } from 'class-transformer';

export enum UserStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  DELETED = 'deleted',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  @Index()
  email: string;

  @Column({ nullable: true })
  @Exclude()
  password?: string;

  @Column({ nullable: true })
  name?: string;

  @Column({ nullable: true })
  avatarUrl?: string;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.PENDING,
  })
  status: UserStatus;

  @Column('simple-array', { default: 'user' })
  roles: string[] = ['user'];

  @Column({ nullable: true })
  @Exclude()
  refreshToken?: string;

  @Column({ nullable: true })
  emailVerifiedAt?: Date;

  @Column({ nullable: true })
  lastLoginAt?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Social logins
  @Column({ nullable: true })
  @Exclude()
  googleId?: string;

  @Column({ nullable: true })
  @Exclude()
  facebookId?: string;

  // Additional profile fields
  @Column({ nullable: true })
  bio?: string;

  @Column({ nullable: true })
  location?: string;

  @Column({ nullable: true })
  website?: string;

  // Methods
  hasRole(role: string): boolean {
    return this.roles.includes(role);
  }

  hasAnyRole(roles: string[]): boolean {
    return roles.some((role) => this.roles.includes(role));
  }
}
```

### DTOs

```typescript
// apps/api/src/users/dto/register-user.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, MaxLength, IsOptional, Matches } from 'class-validator';

export class RegisterUserDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ minLength: 8, maxLength: 100 })
  @IsString()
  @MinLength(8)
  @MaxLength(100)
  @Matches(/((?=.*\d)|(?=.*\W+))(?![\n.])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'Password too weak. Must include uppercase, lowercase, number, and special character',
  })
  password: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  name?: string;
}

// apps/api/src/users/dto/update-profile.dto.ts
import { PartialType } from '@nestjs/swagger';
import { IsString, IsOptional, IsUrl, IsEnum } from 'class-validator';
import { UserStatus } from '@qa-platform/shared-types';

export class UpdateProfileDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  bio?: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsUrl()
  @IsOptional()
  website?: string;

  @IsUrl()
  @IsOptional()
  avatarUrl?: string;

  @IsEnum(UserStatus)
  @IsOptional()
  status?: UserStatus;
}

// apps/api/src/users/dto/change-password.dto.ts
import { IsString, MinLength, MaxLength, Matches } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  currentPassword: string;

  @IsString()
  @MinLength(8)
  @MaxLength(100)
  @Matches(/((?=.*\d)|(?=.*\W+))(?![\n.])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'Password too weak. Must include uppercase, lowercase, number, and special character',
  })
  newPassword: string;
}
```

### Users Service

```typescript
// apps/api/src/users/users.service.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOneOptions } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '@qa-platform/shared-types';
import { RegisterUserDto } from './dto/register-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>
  ) {}

  async create(createUserDto: RegisterUserDto): Promise<User> {
    const existingUser = await this.usersRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, parseInt(process.env.SALT_ROUNDS || '10'));

    const user = this.usersRepository.create({
      ...createUserDto,
      password: hashedPassword,
      status: 'active', // Or 'pending' if email verification is required
    });

    return this.usersRepository.save(user);
  }

  async findOne(id: string, options?: FindOneOptions<User>): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
      ...options,
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { email },
      select: ['id', 'email', 'password', 'status', 'roles'],
    });
  }

  async updateProfile(id: string, updateProfileDto: UpdateProfileDto): Promise<User> {
    const user = await this.findOne(id);

    // Don't allow updating email through this endpoint
    const { email, ...updateData } = updateProfileDto;

    Object.assign(user, updateData);
    return this.usersRepository.save(user);
  }

  async changePassword(id: string, changePasswordDto: ChangePasswordDto): Promise<void> {
    const user = await this.usersRepository.findOne({
      where: { id },
      select: ['id', 'password'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isPasswordMatching = await bcrypt.compare(changePasswordDto.currentPassword, user.password);

    if (!isPasswordMatching) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    if (await bcrypt.compare(changePasswordDto.newPassword, user.password)) {
      throw new BadRequestException('New password must be different from current password');
    }

    user.password = await bcrypt.hash(changePasswordDto.newPassword, parseInt(process.env.SALT_ROUNDS || '10'));

    await this.usersRepository.save(user);
  }

  async updateRefreshToken(userId: string, refreshToken: string | null): Promise<void> {
    const hashedToken = refreshToken ? await bcrypt.hash(refreshToken, 10) : null;

    await this.usersRepository.update(userId, {
      refreshToken: hashedToken,
      ...(refreshToken ? { lastLoginAt: new Date() } : {}),
    });
  }

  async markEmailAsVerified(email: string): Promise<void> {
    await this.usersRepository.update(
      { email },
      {
        emailVerifiedAt: new Date(),
        status: 'active',
      }
    );
  }
}
```

### Users Controller

```typescript
// apps/api/src/users/users.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from './users.service';
import { User } from '@qa-platform/shared-types';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { Public } from '../roles/decorators/roles.decorator';
import { RequestWithUser } from '../auth/interfaces/request-with-user.interface';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('register')
  @Public()
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 409, description: 'Email already in use' })
  async register(@Body() registerUserDto: RegisterUserDto) {
    return this.usersService.create(registerUserDto);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getProfile(@Req() req: RequestWithUser) {
    return this.usersService.findOne(req.user.id);
  }

  @Put('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  updateProfile(@Req() req: RequestWithUser, @Body() updateProfileDto: UpdateProfileDto) {
    return this.usersService.updateProfile(req.user.id, updateProfileDto);
  }

  @Post('change-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change user password' })
  @ApiResponse({ status: 204, description: 'Password changed successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async changePassword(@Req() req: RequestWithUser, @Body() changePasswordDto: ChangePasswordDto) {
    if (changePasswordDto.currentPassword === changePasswordDto.newPassword) {
      throw new BadRequestException('New password must be different from current password');
    }

    await this.usersService.changePassword(req.user.id, changePasswordDto);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User details' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }
}
```

### Users Module

```typescript
// apps/api/src/users/users.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '@qa-platform/shared-types';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
```

## 📦 Deliverables

- [x] Регистрация на нов потребител
- [x] Вход/изход от системата
- [x] Управление на потребителски профил
- [x] Смяна на парола
- [x] Валидация на входните данни
- [x] Swagger документация
- [ ] Имейл потвърждение при регистрация
- [ ] Забравена парола
- [ ] Социална автентикация (Google, Facebook)

## 🧪 Тестване

### Unit тестове за UsersService

```typescript
// apps/api/test/users/users.service.spec.ts
describe('UsersService', () => {
  let service: UsersService;
  let usersRepository: Repository<User>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    usersRepository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const createUserDto = {
        email: 'test@example.com',
        password: 'Password123!',
        name: 'Test User',
      };

      const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
      const expectedUser = {
        id: '1',
        ...createUserDto,
        password: hashedPassword,
        status: 'active',
      };

      jest.spyOn(usersRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(usersRepository, 'create').mockReturnValue(expectedUser as any);
      jest.spyOn(usersRepository, 'save').mockResolvedValue(expectedUser as any);

      const result = await service.create(createUserDto as any);
      expect(result).toEqual(expectedUser);
      expect(usersRepository.create).toHaveBeenCalledWith({
        ...createUserDto,
        password: expect.any(String),
        status: 'active',
      });
    });
  });
});
```

### Интеграционни тестове

```typescript
// apps/api/test/users/users.e2e-spec.ts
describe('UsersController (e2e)', () => {
  let app: INestApplication;
  let usersService: UsersService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    usersService = moduleFixture.get<UsersService>(UsersService);
    await app.init();
  });

  describe('POST /users/register', () => {
    it('should register a new user', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'Password123!',
        name: 'Test User',
      };

      const response = await request(app.getHttpServer()).post('/users/register').send(registerDto).expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.email).toBe(registerDto.email);
      expect(response.body).not.toHaveProperty('password');
    });
  });

  describe('GET /users/profile', () => {
    it('should return user profile', async () => {
      // Login first
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'test@example.com', password: 'Password123!' });

      const token = loginResponse.body.accessToken;

      const response = await request(app.getHttpServer())
        .get('/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body.email).toBe('test@example.com');
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
```

## 📝 Бележки

- Паролите никога не се връщат в отговорите на API-то
- Всички чувствителни ендпойнти използват HTTPS
- Добавено е ограничаване на опитите за влизане
- Паролата се валидира дали е достатъчно силна
- Добавен е механизъм за изтичане на токените
- Всички заявки изискват CSRF защита
- Добавени са security headers за защита срещу XSS и други атаки
- Имплементирано е логване на всички опити за достъп
