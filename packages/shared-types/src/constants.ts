import { AdminRole } from './enums';
import { Permission } from './enums';

export const RolePermissions: Record<AdminRole, Permission[]> = {
  [AdminRole.SUPER_ADMIN]: Object.values(Permission),

  [AdminRole.BUS_MANAGER]: [Permission.MANAGE_BUSES],
  [AdminRole.REPORT_MANAGER]: [Permission.MANAGE_REPORTS],
  [AdminRole.USER_MANAGER]: [Permission.MANAGE_USERS],
  [AdminRole.SYSTEM_MANAGER]: [Permission.MANAGE_SYSTEM],
};
