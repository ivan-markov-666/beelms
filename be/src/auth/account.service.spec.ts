import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { AccountService } from './account.service';
import { User } from './user.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';

describe('AccountService', () => {
  let service: AccountService;
  let usersRepo: jest.Mocked<Repository<User>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AccountService>(AccountService);
    usersRepo = module.get(getRepositoryToken(User));
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('getCurrentProfile returns profile for active user', async () => {
    const user: User = {
      id: 'user-id',
      email: 'test@example.com',
      passwordHash: 'hash',
      active: true,
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-01-01T00:00:00.000Z'),
    } as User;

    (usersRepo.findOne as jest.Mock).mockResolvedValue(user);

    const result = await service.getCurrentProfile('user-id');

    expect(usersRepo.findOne).toHaveBeenCalledWith({ where: { id: 'user-id', active: true } });
    expect(result).toEqual({
      id: 'user-id',
      email: 'test@example.com',
      createdAt: '2024-01-01T00:00:00.000Z',
    });
  });

  it('getCurrentProfile throws NotFoundException when user is not found', async () => {
    (usersRepo.findOne as jest.Mock).mockResolvedValue(undefined);

    await expect(service.getCurrentProfile('missing-id')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('updateEmail updates email when it is free', async () => {
    const user: User = {
      id: 'user-id',
      email: 'old@example.com',
      passwordHash: 'hash',
      active: true,
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-01-01T00:00:00.000Z'),
    } as User;

    const dto: UpdateProfileDto = { email: 'new@example.com' };

    (usersRepo.findOne as jest.Mock)
      .mockResolvedValueOnce(user) // current user
      .mockResolvedValueOnce(null); // no existing user with new email
    (usersRepo.save as jest.Mock).mockImplementation(async (u: User) => u);

    const result = await service.updateEmail('user-id', dto);

    expect(usersRepo.findOne).toHaveBeenNthCalledWith(1, { where: { id: 'user-id', active: true } });
    expect(usersRepo.findOne).toHaveBeenNthCalledWith(2, {
      where: { email: dto.email, active: true },
    });
    expect(usersRepo.save).toHaveBeenCalled();
    expect(result.email).toBe(dto.email);
  });

  it('updateEmail throws NotFoundException when current user is missing', async () => {
    const dto: UpdateProfileDto = { email: 'new@example.com' };

    (usersRepo.findOne as jest.Mock).mockResolvedValue(undefined);

    await expect(service.updateEmail('missing-id', dto)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('updateEmail throws ConflictException when email is already used by another user', async () => {
    const user: User = {
      id: 'user-id',
      email: 'old@example.com',
      passwordHash: 'hash',
      active: true,
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-01-01T00:00:00.000Z'),
    } as User;

    const existing: User = {
      id: 'other-id',
      email: 'new@example.com',
      passwordHash: 'hash2',
      active: true,
      createdAt: new Date('2024-01-02T00:00:00.000Z'),
      updatedAt: new Date('2024-01-02T00:00:00.000Z'),
    } as User;

    const dto: UpdateProfileDto = { email: 'new@example.com' };

    (usersRepo.findOne as jest.Mock)
      .mockResolvedValueOnce(user) // current user
      .mockResolvedValueOnce(existing); // existing user with same email

    await expect(service.updateEmail('user-id', dto)).rejects.toBeInstanceOf(ConflictException);
    expect(usersRepo.save).not.toHaveBeenCalled();
  });

  it('changePassword updates password hash when current password is valid', async () => {
    const oldPassword = 'OldPassword1234';
    const newPassword = 'NewPassword5678';
    const passwordHash = await bcrypt.hash(oldPassword, 10);

    const user: User = {
      id: 'user-id',
      email: 'test@example.com',
      passwordHash,
      active: true,
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-01-01T00:00:00.000Z'),
    } as User;

    (usersRepo.findOne as jest.Mock).mockResolvedValue(user);
    (usersRepo.save as jest.Mock).mockImplementation(async (u: User) => u);

    await service.changePassword('user-id', oldPassword, newPassword);

    expect(usersRepo.findOne).toHaveBeenCalledWith({ where: { id: 'user-id', active: true } });
    expect(usersRepo.save).toHaveBeenCalled();
    expect(user.passwordHash).not.toBe(passwordHash);
    const matchesNew = await bcrypt.compare(newPassword, user.passwordHash);
    expect(matchesNew).toBe(true);
  });

  it('changePassword throws NotFoundException when user is missing', async () => {
    (usersRepo.findOne as jest.Mock).mockResolvedValue(undefined);

    await expect(
      service.changePassword('missing-id', 'OldPassword1234', 'NewPassword5678'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('changePassword throws BadRequestException when current password is invalid', async () => {
    const correctPassword = 'CorrectPassword1234';
    const passwordHash = await bcrypt.hash(correctPassword, 10);

    const user: User = {
      id: 'user-id',
      email: 'test@example.com',
      passwordHash,
      active: true,
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-01-01T00:00:00.000Z'),
    } as User;

    (usersRepo.findOne as jest.Mock).mockResolvedValue(user);

    await expect(
      service.changePassword('user-id', 'WrongPassword1234', 'NewPassword5678'),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(usersRepo.save).not.toHaveBeenCalled();
  });

  it('deleteAccount sets active=false for active user', async () => {
    const user: User = {
      id: 'user-id',
      email: 'test@example.com',
      passwordHash: 'hash',
      active: true,
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-01-01T00:00:00.000Z'),
    } as User;

    (usersRepo.findOne as jest.Mock).mockResolvedValue(user);
    (usersRepo.save as jest.Mock).mockImplementation(async (u: User) => u);

    await service.deleteAccount('user-id');

    expect(usersRepo.findOne).toHaveBeenCalledWith({ where: { id: 'user-id', active: true } });
    expect(usersRepo.save).toHaveBeenCalled();
    expect(user.active).toBe(false);
    expect(user.email).toBe(`deleted+${user.id}@deleted.qa4free.invalid`);
    expect(user.passwordHash).toBe('');
  });

  it('deleteAccount does nothing when user is already inactive or missing', async () => {
    (usersRepo.findOne as jest.Mock).mockResolvedValue(undefined);

    await service.deleteAccount('missing-id');

    expect(usersRepo.findOne).toHaveBeenCalledWith({ where: { id: 'missing-id', active: true } });
    expect(usersRepo.save).not.toHaveBeenCalled();
  });

  it('exportData returns export dto for active user', async () => {
    const user: User = {
      id: 'user-id',
      email: 'test@example.com',
      passwordHash: 'hash',
      active: true,
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-01-01T00:00:00.000Z'),
    } as User;

    (usersRepo.findOne as jest.Mock).mockResolvedValue(user);

    const result = await service.exportData('user-id');

    expect(usersRepo.findOne).toHaveBeenCalledWith({ where: { id: 'user-id', active: true } });
    expect(result).toEqual({
      id: 'user-id',
      email: 'test@example.com',
      createdAt: '2024-01-01T00:00:00.000Z',
      active: true,
    });
  });

  it('exportData throws NotFoundException when user is not found', async () => {
    (usersRepo.findOne as jest.Mock).mockResolvedValue(undefined);

    await expect(service.exportData('missing-id')).rejects.toBeInstanceOf(NotFoundException);
  });
});
