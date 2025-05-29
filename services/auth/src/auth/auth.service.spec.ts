// services/auth/src/auth/auth.service.spec.ts
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { AuthService } from './auth.service';
import { PasswordReset } from './entities/password-reset.entity';
import { Session } from './entities/session.entity';

// Mock bcrypt
jest.mock('bcrypt', () => ({
  genSalt: jest.fn().mockResolvedValue('mockedSalt'),
  hash: jest.fn().mockResolvedValue('hashedPassword'),
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: Repository<User>;
  // Дефинирай тези променливи но ги не маркирай с eslint no-unused-vars
  /* eslint-disable @typescript-eslint/no-unused-vars */
  let passwordResetRepository: Repository<PasswordReset>;
  let sessionRepository: Repository<Session>;
  /* eslint-enable @typescript-eslint/no-unused-vars */
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(PasswordReset),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Session),
          useValue: {
            delete: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(() => 'jwt-token'),
            verify: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    passwordResetRepository = module.get<Repository<PasswordReset>>(
      getRepositoryToken(PasswordReset),
    );
    sessionRepository = module.get<Repository<Session>>(
      getRepositoryToken(Session),
    );
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      // Arrange
      const registerDto = {
        email: 'test@example.com',
        password: 'StrongP@ss1',
      };

      jest
        .spyOn(userRepository, 'findOne')
        .mockImplementation(() => Promise.resolve(null));

      jest.spyOn(userRepository, 'create').mockImplementation(
        () =>
          ({
            id: 1,
            email: registerDto.email,
            passwordHash: 'hashedPassword',
            salt: 'mockedSalt',
            role: 'user',
            isActive: true,
            failedLoginAttempts: 0,
            lastLogin: null,
          }) as User,
      );

      jest
        .spyOn(userRepository, 'save')
        .mockImplementation((user) => Promise.resolve(user as User));

      jest.spyOn(jwtService, 'sign').mockImplementation(() => 'jwt-token');

      // Act
      const result = await service.register(registerDto);

      // Assert
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('token');
      expect(result.user.email).toBe(registerDto.email);
      expect(result.token).toBe('jwt-token');
      expect(bcrypt.genSalt).toHaveBeenCalled();
      expect(bcrypt.hash).toHaveBeenCalledWith(
        registerDto.password,
        'mockedSalt',
      );
      const saveSpy = jest.spyOn(userRepository, 'save');
      const signSpy = jest.spyOn(jwtService, 'sign');
      expect(saveSpy).toHaveBeenCalled();
      expect(signSpy).toHaveBeenCalled();
    });

    it('should throw BadRequestException if user already exists', async () => {
      // Arrange
      const registerDto = {
        email: 'existing@example.com',
        password: 'StrongP@ss1',
      };

      jest.spyOn(userRepository, 'findOne').mockImplementation(() =>
        Promise.resolve({
          id: 1,
          email: registerDto.email,
        } as User),
      );

      // Act & Assert
      await expect(service.register(registerDto)).rejects.toThrow(
        BadRequestException,
      );

      const findOneSpy = jest.spyOn(userRepository, 'findOne');
      expect(findOneSpy).toHaveBeenCalledWith({
        where: { email: registerDto.email },
      });
    });
  });

  describe('login', () => {
    it('should login successfully and return token', async () => {
      // Arrange
      const loginDto = {
        email: 'test@example.com',
        password: 'StrongP@ss1',
      };

      const user = {
        id: 1,
        email: loginDto.email,
        passwordHash: 'hashedPassword',
        salt: 'mockedSalt',
        role: 'user',
        isActive: true,
        failedLoginAttempts: 0,
        lastLogin: null,
      } as User;

      jest.spyOn(userRepository, 'findOne').mockResolvedValue(user);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

      const saveMock = jest
        .fn()
        .mockImplementation((updatedUser: Partial<User>) => {
          const result = {
            ...user,
            ...updatedUser,
            failedLoginAttempts: 0,
            lastLogin: new Date(),
          };
          return Promise.resolve(result as User);
        });
      jest.spyOn(userRepository, 'save').mockImplementation(saveMock);

      jest.spyOn(jwtService, 'sign').mockImplementation(() => 'jwt-token');

      // Act
      const result = await service.login(loginDto);

      // Assert
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('token');
      expect(result.user.email).toBe(loginDto.email);
      expect(result.token).toBe('jwt-token');
      const saveSpy = jest.spyOn(userRepository, 'save');
      const signSpy = jest.spyOn(jwtService, 'sign');
      expect(saveSpy).toHaveBeenCalled();
      expect(signSpy).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if user not found', async () => {
      // Arrange
      const loginDto = {
        email: 'nonexistent@example.com',
        password: 'StrongP@ss1',
      };

      jest
        .spyOn(userRepository, 'findOne')
        .mockImplementation(() => Promise.resolve(null));

      // Act & Assert
      await expect(async () => {
        await service.login(loginDto);
      }).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if account is not active', async () => {
      // Arrange
      const loginDto = {
        email: 'inactive@example.com',
        password: 'StrongP@ss1',
      };

      jest.spyOn(userRepository, 'findOne').mockImplementation(() =>
        Promise.resolve({
          id: 1,
          email: loginDto.email,
          passwordHash: 'hashedPassword',
          salt: 'mockedSalt',
          role: 'user',
          isActive: false,
          failedLoginAttempts: 0,
          lastLogin: null,
        } as User),
      );

      // Act & Assert
      await expect(async () => {
        await service.login(loginDto);
      }).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      // Arrange
      const loginDto = {
        email: 'test@example.com',
        password: 'WrongP@ss1',
      };

      const user = {
        id: 1,
        email: loginDto.email,
        passwordHash: 'hashedPassword',
        salt: 'mockedSalt',
        role: 'user',
        isActive: true,
        failedLoginAttempts: 0,
        lastLogin: null,
      } as User;

      jest
        .spyOn(userRepository, 'findOne')
        .mockImplementation(() => Promise.resolve(user));

      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      jest.spyOn(userRepository, 'save').mockImplementation((user) =>
        Promise.resolve({
          ...user,
          failedLoginAttempts: 1,
        } as User),
      );

      // Act & Assert
      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );

      const saveSpy = jest.spyOn(userRepository, 'save');
      expect(saveSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          failedLoginAttempts: 1,
        }),
      );
    });

    it('should lock account after 5 failed login attempts', async () => {
      // Arrange
      const loginDto = {
        email: 'test@example.com',
        password: 'WrongP@ss1',
      };

      const user = {
        id: 1,
        email: loginDto.email,
        passwordHash: 'hashedPassword',
        salt: 'mockedSalt',
        role: 'user',
        isActive: true,
        failedLoginAttempts: 4,
        lastLogin: null,
      } as User;

      jest.spyOn(userRepository, 'findOne').mockResolvedValue(user);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      const saveSpy = jest
        .spyOn(userRepository, 'save')
        .mockImplementation((updatedUser) =>
          Promise.resolve({
            ...user,
            ...(updatedUser as Partial<User>),
            failedLoginAttempts: 5,
            isActive: false,
          } as User),
        );

      // Act & Assert
      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );

      expect(saveSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          failedLoginAttempts: 5,
          isActive: false,
        }),
      );
    });
  });

  // Можете да добавите още тестове за останалите методи
});
