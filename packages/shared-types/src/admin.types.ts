import { AdminRole } from './enums.js';

export interface IAdmin {
  id: string;
  fullName: string;
  username: string;
  email: string;
  adminRole: AdminRole;
  avatar?: string;
  isActive: boolean;
  lastLoginAt?: string | Date;
  createdAt: string;
  updatedAt: string;
}
