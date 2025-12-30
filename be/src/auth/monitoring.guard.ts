import { RoleGuard } from './role.guard';

export const MonitoringGuard = RoleGuard(['admin', 'monitoring'] as const);
