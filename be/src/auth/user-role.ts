export const USER_ROLES = [
  'user',
  'admin',
  'monitoring',
  'teacher',
  'author',
] as const;

export type UserRole = (typeof USER_ROLES)[number];
