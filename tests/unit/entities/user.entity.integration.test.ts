import 'reflect-metadata';
import { DataSource, Repository } from 'typeorm';
import { User } from '../../../packages/shared-types/src/entities/user.entity';
import { UserRole } from '../../../packages/shared-types/src/entities/user-role.enum';

describe('User Entity Integration Tests', () => {
  let dataSource: DataSource;
  let userRepository: Repository<User>;

  beforeAll(async () => {
    // Създаваме in-memory SQLite връзка за тестове
    dataSource = new DataSource({
      type: 'sqlite',
      database: ':memory:',
      dropSchema: true,
      entities: [User],
      synchronize: true,
      logging: false,
    });

    await dataSource.initialize();
    userRepository = dataSource.getRepository(User);
  });

  afterAll(async () => {
    if (dataSource && dataSource.isInitialized) {
      await dataSource.destroy();
    }
  });

  it('should create and retrieve a user', async () => {
    // Създаваме нов потребител
    const user = new User();
    user.email = 'test@example.com';
    user.username = 'testuser';
    user.passwordHash = 'hashed_password';
    user.role = UserRole.STUDENT;
    user.isActive = true;
    user.firstName = 'Test';
    user.lastName = 'User';

    // Запазваме в базата данни
    const savedUser = await userRepository.save(user);

    // Извличаме от базата данни
    const foundUser = await userRepository.findOne({ where: { email: 'test@example.com' } });

    expect(foundUser).toBeDefined();
    expect(foundUser!.id).toBeDefined();
    expect(foundUser!.id).toBe(savedUser.id);
    expect(foundUser!.email).toBe('test@example.com');
    expect(foundUser!.username).toBe('testuser');
    expect(foundUser!.role).toBe(UserRole.STUDENT);
    expect(foundUser!.fullName()).toBe('Test User');
  });

  it('should enforce unique email constraint', async () => {
    // Създаваме първи потребител
    const user1 = new User();
    user1.email = 'unique@example.com';
    user1.username = 'uniqueuser1';
    user1.passwordHash = 'hashed_password';
    user1.role = UserRole.STUDENT;

    await userRepository.save(user1);

    // Опитваме се да създадем втори потребител със същия email
    const user2 = new User();
    user2.email = 'unique@example.com';
    user2.username = 'uniqueuser2';
    user2.passwordHash = 'hashed_password';
    user2.role = UserRole.STUDENT;

    await expect(userRepository.save(user2)).rejects.toThrow();
  });

  it('should enforce unique username constraint', async () => {
    // Създаваме първи потребител
    const user1 = new User();
    user1.email = 'email1@example.com';
    user1.username = 'sameusername';
    user1.passwordHash = 'hashed_password';
    user1.role = UserRole.STUDENT;

    await userRepository.save(user1);

    // Опитваме се да създадем втори потребител със същото потребителско име
    const user2 = new User();
    user2.email = 'email2@example.com';
    user2.username = 'sameusername';
    user2.passwordHash = 'hashed_password';
    user2.role = UserRole.STUDENT;

    await expect(userRepository.save(user2)).rejects.toThrow();
  });

  it('should update user properties correctly', async () => {
    // Създаваме потребител
    const user = new User();
    user.email = 'update@example.com';
    user.username = 'updateuser';
    user.passwordHash = 'hashed_password';
    user.role = UserRole.STUDENT;
    user.firstName = 'Original';
    user.lastName = 'Name';

    // Запазваме
    const savedUser = await userRepository.save(user);

    // Актуализираме
    savedUser.firstName = 'Updated';
    savedUser.lastName = 'Person';
    savedUser.role = UserRole.INSTRUCTOR;
    await userRepository.save(savedUser);

    // Проверяваме за промените
    const updatedUser = await userRepository.findOne({ where: { id: savedUser.id } });

    expect(updatedUser).toBeDefined();
    expect(updatedUser!.firstName).toBe('Updated');
    expect(updatedUser!.lastName).toBe('Person');
    expect(updatedUser!.role).toBe(UserRole.INSTRUCTOR);
    expect(updatedUser!.fullName()).toBe('Updated Person');
    expect(updatedUser!.isInstructor()).toBe(true);
    expect(updatedUser!.isStudent()).toBe(false);
  });
});
