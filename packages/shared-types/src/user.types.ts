import { Gender, LoyaltyTier } from './enums.js';

export interface IUser {
  id: string;
  fullName: string;
  email: string;
  dateOfBirth: Date;
  gender: Gender;
  phone?: string;
  avatar?: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  isBlocked: boolean;
  loyaltyPoints: number;
  loyaltyTier: LoyaltyTier;
  totalBookings: number;
  totalSpent: number;
  totalTrips: number;
  createdAt: string;
  updatedAt: string;
}
