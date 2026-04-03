import { SetMetadata } from '@nestjs/common';
import { SystemRole } from '@ve_xe_nhanh_ts/shared-types';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: SystemRole[]) => SetMetadata(ROLES_KEY, roles);
