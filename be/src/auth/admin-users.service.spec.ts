import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import type { Repository, SelectQueryBuilder } from 'typeorm';
import { AdminUsersService } from './admin-users.service';
import { User } from './user.entity';

class TestUser extends User {
  constructor(init?: Partial<User>) {
    super();
    Object.assign(this, init);
  }
}

describe('AdminUsersService', () => {
  let service: AdminUsersService;
  let usersRepo: jest.Mocked<Repository<User>>;
  let qb: jest.Mocked<SelectQueryBuilder<User>>;

  beforeEach(async () => {
    qb = {
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
    } as unknown as jest.Mocked<SelectQueryBuilder<User>>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminUsersService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            createQueryBuilder: jest.fn().mockReturnValue(qb),
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(AdminUsersService);
    usersRepo = module.get(getRepositoryToken(User));
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('getAdminUsersList returns mapped summaries with default pagination when page/pageSize are not provided', async () => {
    const now = new Date();
    const users: User[] = [
      new TestUser({
        id: '1',
        email: 'user1@example.com',
        role: 'user',
        active: true,
        createdAt: now,
      }),
      new TestUser({
        id: '2',
        email: 'user2@example.com',
        role: 'admin',
        active: false,
        createdAt: now,
      }),
    ];

    (qb.getMany as jest.Mock).mockResolvedValue(users);

    const result = await service.getAdminUsersList(undefined, undefined, undefined);

    expect(usersRepo.createQueryBuilder).toHaveBeenCalledWith('user');
    expect(qb.skip).toHaveBeenCalledWith(0); // (page 1 - 1) * 20 default pageSize
    expect(qb.take).toHaveBeenCalledWith(20);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      id: '1',
      email: 'user1@example.com',
      role: 'user',
      active: true,
      createdAt: now.toISOString(),
    });
  });

  it('getAdminUsersList applies email filter when q is provided', async () => {
    (qb.getMany as jest.Mock).mockResolvedValue([]);

    await service.getAdminUsersList(2, 10, ' Test@Example.COM ');

    expect(qb.where).toHaveBeenCalledTimes(1);
    const [condition, params] = (qb.where as jest.Mock).mock.calls[0];
    expect(condition).toBe('LOWER(user.email) LIKE :q');
    expect(params).toEqual({ q: '%test@example.com%' });
    expect(qb.skip).toHaveBeenCalledWith((2 - 1) * 10);
    expect(qb.take).toHaveBeenCalledWith(10);
  });

  it('updateUserActive updates active flag when user exists', async () => {
    const existing = new TestUser({
      id: '123',
      email: 'user@example.com',
      role: 'user',
      active: true,
      createdAt: new Date(),
    });

    (usersRepo.findOne as jest.Mock).mockResolvedValue(existing);
    (usersRepo.save as jest.Mock).mockImplementation(async (u: User) => u);

    const result = await service.updateUserActive('123', false);

    expect(usersRepo.findOne).toHaveBeenCalledWith({ where: { id: '123' } });
    expect(usersRepo.save).toHaveBeenCalledTimes(1);
    expect(result.id).toBe('123');
    expect(result.active).toBe(false);
  });

  it('updateUserActive throws when user is not found', async () => {
    (usersRepo.findOne as jest.Mock).mockResolvedValue(undefined);

    await expect(service.updateUserActive('missing-id', false)).rejects.toThrow(
      'User not found',
    );
  });
});
