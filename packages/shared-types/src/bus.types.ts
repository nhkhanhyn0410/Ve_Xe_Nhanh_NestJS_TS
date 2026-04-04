import { BusType, BusStatus, BusAmenity } from './enums.js';

export interface ISeatLayout {
  floors: number;
  rows: number;
  columns: number;
  layout: string[][];
  totalSeats: number;
}

export interface IRegistrationInfo {
  certificateNumber?: string;
  payloadCapacity?: number;
  expirationDate?: string;
  insuranceExpirationDate?: string;
  ownerName?: string;
}

export interface IBus {
  id: string;
  operatorId: string; // Ref to BusOperator
  
  busNumber: string;
  busType: BusType;
  
  seatLayout: ISeatLayout;
  amenities: BusAmenity[];
  status: BusStatus;

  // Optionals
  description?: string;
  images?: string[];
  actualImages?: string[];
  registrationInfo?: IRegistrationInfo;

  createdAt: string;
  updatedAt: string;

  // Virtuals
  displayName?: string;
  isAvailable?: boolean;
}
