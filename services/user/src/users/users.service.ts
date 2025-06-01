import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UserProfile } from './entities/user-profile.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import {
  UpdateUserSettingsDto,
  UserSettingsDto,
} from './dto/user-settings.dto';
import { PasswordUtils } from '../shared/utils/password.utils';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(UserProfile)
    private profilesRepository: Repository<UserProfile>,
  ) {}

  async findAll(): Promise<User[]> {
    return this.usersRepository.find({
      relations: ['profile'],
    });
  }

  async findOne(id: number): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['profile'],
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async findOneByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { email },
      relations: ['profile'],
    });
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    // Check if user with this email already exists
    const existingUser = await this.findOneByEmail(createUserDto.email);
    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }

    // Generate a secure salt for this user
    const salt = PasswordUtils.generateSalt();

    // Hash the password with the salt
    const passwordHash = PasswordUtils.hashPassword(
      createUserDto.password,
      salt,
    );

    // Create the user with secure password
    const user = this.usersRepository.create({
      email: createUserDto.email,
      password_hash: passwordHash,
      salt: salt,
    });

    return this.usersRepository.save(user);
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    // Update user properties
    if (updateUserDto.email) {
      // Check if email is already taken by another user
      const existingUser = await this.findOneByEmail(updateUserDto.email);
      if (existingUser && existingUser.id !== id) {
        throw new BadRequestException('Email already in use');
      }
      user.email = updateUserDto.email;
    }

    if (updateUserDto.role !== undefined) {
      user.role = updateUserDto.role;
    }

    if (updateUserDto.is_active !== undefined) {
      user.is_active = updateUserDto.is_active;
    }

    // Update password if provided
    if (updateUserDto.password) {
      // Generate a new salt for security
      user.salt = PasswordUtils.generateSalt();
      // Hash the new password
      user.password_hash = PasswordUtils.hashPassword(
        updateUserDto.password,
        user.salt,
      );
    }

    return this.usersRepository.save(user);
  }

  async remove(id: number): Promise<void> {
    const user = await this.findOne(id);
    await this.usersRepository.remove(user);
  }

  async deactivate(id: number): Promise<User> {
    const user = await this.findOne(id);
    user.is_active = false;
    return this.usersRepository.save(user);
  }

  async createProfile(
    userId: number,
    createProfileDto: CreateProfileDto,
  ): Promise<UserProfile> {
    // Check if user exists
    const user = await this.findOne(userId);

    // Check if profile already exists
    if (user.profile) {
      throw new BadRequestException('User already has a profile');
    }

    // Create profile
    const profile = this.profilesRepository.create({
      userId,
      ...createProfileDto,
    });

    return this.profilesRepository.save(profile);
  }

  async updateProfile(
    userId: number,
    updateProfileDto: UpdateProfileDto,
  ): Promise<UserProfile> {
    const user = await this.findOne(userId);

    // Check if profile exists
    if (!user.profile) {
      throw new NotFoundException(
        `Profile for user with ID ${userId} not found`,
      );
    }

    // Update profile properties
    const profile = user.profile;
    Object.assign(profile, updateProfileDto);

    return this.profilesRepository.save(profile);
  }

  async getProfile(userId: number): Promise<UserProfile> {
    const user = await this.findOne(userId);

    if (!user.profile) {
      throw new NotFoundException(
        `Profile for user with ID ${userId} not found`,
      );
    }

    return user.profile;
  }

  /**
   * Получава настройките на потребителя
   * @param userId ID на потребителя
   * @returns Настройки на потребителя
   */
  async getUserSettings(userId: number): Promise<UserSettingsDto> {
    const user = await this.findOne(userId);

    // Ако потребителят няма профил, няма и настройки - създаваме празни настройки
    if (!user.profile) {
      return { preferences: {} };
    }

    return { preferences: user.profile.preferences || {} };
  }

  /**
   * Актуализира настройките на потребителя
   * @param userId ID на потребителя
   * @param updateUserSettingsDto Обект с новите настройки
   * @returns Актуализирани настройки
   */
  async updateUserSettings(
    userId: number,
    updateUserSettingsDto: UpdateUserSettingsDto,
  ): Promise<UserSettingsDto> {
    const user = await this.findOne(userId);

    // Ако потребителят няма профил, трябва да създадем първо профил
    if (!user.profile) {
      const profile = this.profilesRepository.create({
        userId,
        preferences: updateUserSettingsDto.preferences || {},
      });
      await this.profilesRepository.save(profile);
      return { preferences: profile.preferences };
    }

    // Ако потребителят има профил, актуализираме настройките
    const currentPreferences = user.profile.preferences || {};
    user.profile.preferences = {
      ...currentPreferences,
      ...updateUserSettingsDto.preferences,
    };

    const updatedProfile = await this.profilesRepository.save(user.profile);
    return { preferences: updatedProfile.preferences };
  }

  /**
   * Нулира настройките на потребителя до стойности по подразбиране
   * @param userId ID на потребителя
   * @returns Настройки по подразбиране
   */
  async resetUserSettings(userId: number): Promise<UserSettingsDto> {
    const user = await this.findOne(userId);

    // Проверяваме дали потребителят има профил
    if (!user.profile) {
      throw new NotFoundException(
        `Profile for user with ID ${userId} not found`,
      );
    }

    // Задаваме настройки по подразбиране
    const defaultPreferences = {
      darkMode: false,
      notifications: {
        email: true,
        push: true,
      },
      language: 'bg',
      pageSize: 10,
    };

    // Записваме настройките по подразбиране
    user.profile.preferences = defaultPreferences;
    const updatedProfile = await this.profilesRepository.save(user.profile);

    return { preferences: updatedProfile.preferences };
  }
}
