import { LoyaltyTier } from './enums';

export interface IUser {
  id: string;
  fullName: string;
  email: string;
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
