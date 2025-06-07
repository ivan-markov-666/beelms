import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './entities/user.entity';
import { EncryptSensitiveData } from '../common/interceptors/encryption.interceptor';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Създаване на нов потребител' })
  @ApiResponse({
    status: 201,
    description: 'Потребителят е създаден успешно',
    type: User,
  })
  @ApiResponse({ status: 409, description: 'Имейлът вече съществува' })
  async create(@Body() createUserDto: CreateUserDto): Promise<User> {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Намиране на всички потребители' })
  @ApiResponse({
    status: 200,
    description: 'Връща всички потребители',
    type: [User],
  })
  // Добавяне на декоратор за автоматично криптиране на чувствителни полета в отговора
  @EncryptSensitiveData(['email', 'phone', 'address'])
  async findAll(): Promise<User[]> {
    return this.usersService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Намиране на потребител по ID' })
  @ApiResponse({
    status: 200,
    description: 'Връща данни за потребителя',
    type: User,
  })
  @ApiResponse({
    status: 404,
    description: 'Потребителят не е намерен',
  })
  // Добавяне на декоратор за автоматично криптиране на чувствителни полета в отговора
  @EncryptSensitiveData(['email', 'phone', 'address'])
  async findOne(@Param('id') id: string): Promise<User> {
    return this.usersService.findOne(id);
  }
}
