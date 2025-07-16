import { validate } from 'class-validator';
import { User } from '../../../packages/shared-types/src/entities/user.entity';
import { UserRole } from '../../../packages/shared-types/src/entities/user-role.enum';

describe('User Entity', () => {
  // Вспомогательная функция для создания валидного пользователя
  function createValidUser(): User {
    const user = new User();
    user.email = 'test@example.com';
    user.username = 'testuser';
    user.passwordHash = 'hashed_password_123';
    user.role = UserRole.STUDENT;
    user.isActive = true;
    user.preferredLanguage = 'bg';
    return user;
  }

  it('should validate a valid user', async () => {
    // Arrange
    const user = createValidUser();

    // Act
    const errors = await validate(user);

    // Assert
    expect(errors.length).toBe(0);
  });

  it('should detect an invalid email', async () => {
    // Arrange
    const user = createValidUser();
    user.email = 'invalid-email';

    // Act
    const errors = await validate(user);

    // Assert
    expect(errors.length).toBeGreaterThan(0);
    const emailErrors = errors.filter((err) => err.property === 'email');
    expect(emailErrors.length).toBeGreaterThan(0);
  });

  it('should detect an empty email', async () => {
    // Arrange
    const user = createValidUser();
    user.email = '';

    // Act
    const errors = await validate(user);

    // Assert
    expect(errors.length).toBeGreaterThan(0);
    const emailErrors = errors.filter((err) => err.property === 'email');
    expect(emailErrors.length).toBeGreaterThan(0);
  });

  it('should detect an invalid username format', async () => {
    // Arrange
    const user = createValidUser();
    user.username = 'invalid username with spaces';

    // Act
    const errors = await validate(user);

    // Assert
    expect(errors.length).toBeGreaterThan(0);
    const usernameErrors = errors.filter((err) => err.property === 'username');
    expect(usernameErrors.length).toBeGreaterThan(0);
  });

  it('should detect a username that is too short', async () => {
    // Arrange
    const user = createValidUser();
    user.username = 'ab'; // Minimum length is 3

    // Act
    const errors = await validate(user);

    // Assert
    expect(errors.length).toBeGreaterThan(0);
    const usernameErrors = errors.filter((err) => err.property === 'username');
    expect(usernameErrors.length).toBeGreaterThan(0);
  });

  it('should detect a username that is too long', async () => {
    // Arrange
    const user = createValidUser();
    user.username = 'a'.repeat(31); // Maximum length is 30

    // Act
    const errors = await validate(user);

    // Assert
    expect(errors.length).toBeGreaterThan(0);
    const usernameErrors = errors.filter((err) => err.property === 'username');
    expect(usernameErrors.length).toBeGreaterThan(0);
  });

  it('should detect an empty password hash', async () => {
    // Arrange
    const user = createValidUser();
    user.passwordHash = '';

    // Act
    const errors = await validate(user);

    // Assert
    expect(errors.length).toBeGreaterThan(0);
    const passwordHashErrors = errors.filter((err) => err.property === 'passwordHash');
    expect(passwordHashErrors.length).toBeGreaterThan(0);
  });

  describe('Helper methods', () => {
    it('should return correct full name when both firstName and lastName are set', () => {
      // Arrange
      const user = createValidUser();
      user.firstName = 'John';
      user.lastName = 'Doe';

      // Act & Assert
      expect(user.fullName).toBe('John Doe');
    });

    it('should return only firstName when lastName is not set', () => {
      // Arrange
      const user = createValidUser();
      user.firstName = 'John';
      user.lastName = undefined;

      // Act & Assert
      expect(user.fullName).toBe('John');
    });

    it('should return only lastName when firstName is not set', () => {
      // Arrange
      const user = createValidUser();
      user.firstName = undefined;
      user.lastName = 'Doe';

      // Act & Assert
      expect(user.fullName).toBe('Doe');
    });

    it('should return empty string when neither firstName nor lastName is set', () => {
      // Arrange
      const user = createValidUser();
      user.firstName = undefined;
      user.lastName = undefined;

      // Act & Assert
      expect(user.fullName).toBe('');
    });

    it('should correctly check if user has a specific role', () => {
      // Arrange
      const user = createValidUser();
      user.role = UserRole.ADMIN;

      // Act & Assert
      expect(user.hasRole(UserRole.ADMIN)).toBe(true);
      expect(user.hasRole(UserRole.INSTRUCTOR)).toBe(false);
      expect(user.hasRole(UserRole.STUDENT)).toBe(false);
    });

    it('should correctly identify an admin user', () => {
      // Arrange
      const user = createValidUser();

      // Act & Assert
      user.role = UserRole.ADMIN;
      expect(user.isAdmin()).toBe(true);

      user.role = UserRole.INSTRUCTOR;
      expect(user.isAdmin()).toBe(false);

      user.role = UserRole.STUDENT;
      expect(user.isAdmin()).toBe(false);
    });

    it('should correctly identify an instructor user', () => {
      // Arrange
      const user = createValidUser();

      // Act & Assert
      user.role = UserRole.INSTRUCTOR;
      expect(user.isInstructor()).toBe(true);

      user.role = UserRole.ADMIN;
      expect(user.isInstructor()).toBe(false);

      user.role = UserRole.STUDENT;
      expect(user.isInstructor()).toBe(false);
    });
  });
});
