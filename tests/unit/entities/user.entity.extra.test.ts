// Additional unit tests for User entity
import 'reflect-metadata';
import { validate } from 'class-validator';
import { User } from '../../../packages/shared-types/src/entities/user.entity';
import { UserRole } from '../../../packages/shared-types/src/entities/user-role.enum';

// Helper to construct a valid user instance
const createValidUser = (): User => {
  const user = new User();
  user.email = 'extra@example.com';
  user.username = 'extrauser';
  user.passwordHash = 'hashed_password_456';
  user.role = UserRole.STUDENT;
  user.isActive = true;
  user.preferredLanguage = 'bg';
  return user;
};

describe('User Entity – Additional Validation', () => {
  it('should accept preferredLanguage within the allowed set', async () => {
    const user = createValidUser();
    user.preferredLanguage = 'en';

    const errors = await validate(user);
    expect(errors.length).toBe(0);
  });

  it('should accept a valid Date value for lastLoginAt', async () => {
    const user = createValidUser();
    user.lastLoginAt = new Date();

    const errors = await validate(user);
    expect(errors.length).toBe(0);
  });

  it('should detect an invalid value for lastLoginAt', async () => {
    // ESLint rule requires avoiding `any` – we intentionally bypass strict typing for this negative test
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const user: any = createValidUser();
    // Intentionally assign a string to trigger IsDate validation failure
    user.lastLoginAt = 'invalid-date-string';

    const errors = await validate(user);
    expect(errors.some((e) => e.property === 'lastLoginAt')).toBe(true);
  });

  it('should persist inactive user state without validation errors', async () => {
    const user = createValidUser();
    user.isActive = false;

    const errors = await validate(user);
    expect(errors.length).toBe(0);
    expect(user.isActive).toBe(false);
  });
});
