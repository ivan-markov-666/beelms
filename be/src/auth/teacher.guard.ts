import { RoleGuard } from './role.guard';

export const TeacherGuard = RoleGuard(['admin', 'teacher'] as const);
