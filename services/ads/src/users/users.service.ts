import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { EncryptionService } from '../common/services/encryption.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly encryptionService: EncryptionService,
  ) {}

  /**
   * Създава нов потребител с хеширана парола и криптирани чувствителни данни
   */
  async create(createUserDto: CreateUserDto): Promise<User> {
    // Проверка дали имейлът вече съществува
    // Тъй като имейлът се криптира в базата, трябва да търсим по декриптирани стойности
    const users = await this.usersRepository.find();
    const existingUser = users.find(
      (user) =>
        this.encryptionService.decrypt(user.email) === createUserDto.email,
    );

    if (existingUser) {
      throw new ConflictException('Вече съществува потребител с този имейл');
    }

    // Хеширане на паролата с bcrypt
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(createUserDto.password, salt);

    // Създаване на нов потребител (трансформерите ще криптират автоматично чувствителни полета)
    const newUser = this.usersRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });

    // Записване в базата данни
    return this.usersRepository.save(newUser);
  }

  /**
   * Намира всички потребители
   * Декриптирането на чувствителни полета се извършва автоматично от трансформерите
   */
  async findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  /**
   * Намира потребител по ID
   */
  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findOneBy({ id });

    if (!user) {
      throw new NotFoundException(`Потребител с ID ${id} не е намерен`);
    }

    return user;
  }

  /**
   * Намира потребител по имейл
   * Имейлът в базата е криптиран, затова трябва да извличаме всички и да декриптираме
   */
  async findByEmail(email: string): Promise<User | null> {
    // Извличане на всички потребители, тъй като не можем да търсим директно по криптирани данни
    const users = await this.usersRepository.find();

    // Търсене на потребител със съвпадащ имейл след декриптиране
    return (
      users.find((user) => {
        try {
          const decryptedEmail = this.encryptionService.decrypt(user.email);
          return decryptedEmail === email;
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';
          console.error(
            `Грешка при декриптиране на имейл за потребител ${user.id}:`,
            errorMessage,
          );
          return false;
        }
      }) || null
    );
  }
}
