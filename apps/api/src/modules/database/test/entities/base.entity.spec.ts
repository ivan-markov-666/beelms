import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../../entities/user.entity';
import { DbTestModule } from '../db-test.module';

describe('BaseEntity', () => {
  let module: TestingModule;
  let repository: Repository<User>;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [DbTestModule],
    }).compile();

    repository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  afterAll(async () => {
    await module.close();
  });

  it('should have id, createdAt, and updatedAt columns defined', async () => {
    // Create a test user to check base entity fields
    const user = new User();
    user.email = 'test@example.com';
    user.username = 'testuser';
    user.passwordHash = 'hashedpassword';
    user.role = UserRole.USER;

    await repository.save(user);
    const savedUser = await repository.findOne({ where: { id: user.id } });

    expect(savedUser).toBeDefined();
    expect(savedUser?.id).toBeDefined();
    expect(savedUser?.createdAt).toBeInstanceOf(Date);
    expect(savedUser?.updatedAt).toBeInstanceOf(Date);
  });

  it('should have datetime type for timestamp fields to support SQLite', () => {
    const metadata = repository.metadata;
    const createdAtColumn = metadata.findColumnWithPropertyName('createdAt');
    const updatedAtColumn = metadata.findColumnWithPropertyName('updatedAt');

    expect(createdAtColumn?.type).toBe('datetime');
    expect(updatedAtColumn?.type).toBe('datetime');
  });
});
