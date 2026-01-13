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
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
      getManyAndCount: jest.fn(),
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
            count: jest.fn(),
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

    (qb.getManyAndCount as jest.Mock).mockResolvedValue([users, users.length]);

    const result = await service.getAdminUsersList(
      undefined,
      undefined,
      undefined,
    );

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
    (qb.getManyAndCount as jest.Mock).mockResolvedValue([[], 0]);

    await service.getAdminUsersList(2, 10, ' Test@Example.COM ');

    expect(qb.where).toHaveBeenCalledTimes(1);
    expect(qb.where).toHaveBeenCalledWith('LOWER(user.email) LIKE :q', {
      q: '%test@example.com%',
    });
    expect(qb.skip).toHaveBeenCalledWith((2 - 1) * 10);
    expect(qb.take).toHaveBeenCalledWith(10);
  });

  it('getAdminUsersList applies active status filter when status is active without q', async () => {
    (qb.getManyAndCount as jest.Mock).mockResolvedValue([[], 0]);

    await service.getAdminUsersList(1, 20, undefined, 'active');

    expect(qb.where).toHaveBeenCalledWith('user.active = :active', {
      active: true,
    });
    expect(qb.andWhere).not.toHaveBeenCalled();
  });

  it('getAdminUsersList combines q, status and role filters', async () => {
    (qb.getManyAndCount as jest.Mock).mockResolvedValue([[], 0]);

    await service.getAdminUsersList(1, 20, ' ADMIN ', 'deactivated', 'admin');

    expect(qb.where).toHaveBeenCalledWith('LOWER(user.email) LIKE :q', {
      q: '%admin%',
    });
    expect(qb.andWhere).toHaveBeenCalledWith('user.active = :active', {
      active: false,
    });
    expect(qb.andWhere).toHaveBeenCalledWith('user.role = :role', {
      role: 'admin',
    });
  });

  it('updateUser updates active flag when user exists', async () => {
    const existing = new TestUser({
      id: '123',
      email: 'user@example.com',
      role: 'user',
      active: true,
      createdAt: new Date(),
    });

    (usersRepo.findOne as jest.Mock).mockResolvedValue(existing);
    (usersRepo.save as jest.Mock).mockImplementation(async (u: User) => u);

    const result = await service.updateUser('123', { active: false });

    expect(usersRepo.findOne).toHaveBeenCalledWith({ where: { id: '123' } });
    expect(usersRepo.save).toHaveBeenCalledTimes(1);
    expect(result.id).toBe('123');
    expect(result.active).toBe(false);
  });

  it('updateUser throws when user is not found', async () => {
    (usersRepo.findOne as jest.Mock).mockResolvedValue(undefined);

    await expect(
      service.updateUser('missing-id', { active: false }),
    ).rejects.toThrow('User not found');
  });

  it('getAdminUsersStats returns aggregated counts', async () => {
    (usersRepo.count as jest.Mock)
      .mockResolvedValueOnce(10) // total
      .mockResolvedValueOnce(7) // active
      .mockResolvedValueOnce(3); // admins

    const result = await service.getAdminUsersStats();

    expect(usersRepo.count).toHaveBeenCalledTimes(3);
    expect(usersRepo.count).toHaveBeenNthCalledWith(1);
    expect(usersRepo.count).toHaveBeenNthCalledWith(2, {
      where: { active: true },
    });
    expect(usersRepo.count).toHaveBeenNthCalledWith(3, {
      where: { role: 'admin' },
    });

    expect(result).toEqual({
      totalUsers: 10,
      activeUsers: 7,
      deactivatedUsers: 3,
      adminUsers: 3,
    });
  });
});
