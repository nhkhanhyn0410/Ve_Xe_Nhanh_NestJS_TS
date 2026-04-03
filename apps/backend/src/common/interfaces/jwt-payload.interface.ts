import { SystemRole } from '@ve_xe_nhanh_ts/shared-types';

export interface JwtPayload {
  sub: string; // user id
  email: string;
  role: SystemRole;
  iat?: number;
  exp?: number;
}
