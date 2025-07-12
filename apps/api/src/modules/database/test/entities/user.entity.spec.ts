import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../../entities/user.entity';
import { DbTestModule } from '../db-test.module';

describe('User Entity', () => {
  let module: TestingModule;
  let userRepository: Repository<User>;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [DbTestModule],
    }).compile();

    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  afterAll(async () => {
    await module.close();
  });

  it('should define the entity', () => {
    expect(userRepository).toBeDefined();
  });

  it('should have correct columns', () => {
    const metadata = userRepository.metadata;

    expect(metadata.columns.some((col) => col.propertyName === 'email')).toBe(true);
    expect(metadata.columns.some((col) => col.propertyName === 'username')).toBe(true);
    expect(metadata.columns.some((col) => col.propertyName === 'passwordHash')).toBe(true);
    expect(metadata.columns.some((col) => col.propertyName === 'role')).toBe(true);
    expect(metadata.columns.some((col) => col.propertyName === 'firstName')).toBe(true);
    expect(metadata.columns.some((col) => col.propertyName === 'lastName')).toBe(true);
  });

  it('should create a user', async () => {
    const user = new User();
    user.email = 'test@example.com';
    user.username = 'testuser';
    user.passwordHash = 'hashedpassword';
    user.role = UserRole.USER;

    await userRepository.save(user);
    const savedUser = await userRepository.findOne({ where: { id: user.id } });

    expect(savedUser).toBeDefined();
    expect(savedUser?.email).toBe('test@example.com');
    expect(savedUser?.username).toBe('testuser');
    expect(savedUser?.role).toBe(UserRole.USER);
  });

  it('should enforce unique email constraint', async () => {
    const user1 = new User();
    user1.email = 'unique@example.com';
    user1.username = 'uniqueuser1';
    user1.passwordHash = 'hashedpassword1';
    user1.role = UserRole.USER;

    await userRepository.save(user1);

    const user2 = new User();
    user2.email = 'unique@example.com'; // Duplicate email
    user2.username = 'uniqueuser2';
    user2.passwordHash = 'hashedpassword2';
    user2.role = UserRole.USER;

    await expect(userRepository.save(user2)).rejects.toThrow();
  });
});
