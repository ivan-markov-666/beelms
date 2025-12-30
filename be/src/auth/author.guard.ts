import { RoleGuard } from './role.guard';

export const AuthorGuard = RoleGuard(['admin', 'author'] as const);
