import { BookingStatus } from './enums';

export interface ISeatSelection {
  seatNumber: string;
  passengerName: string;
  passengerPhone: string;
  passengerIdCard?: string;
}

export interface IContactInfo {
  fullName: string;
  email: string;
  phone: string;
}

export interface IBooking {
  id: string;
  bookingCode: string;
  tripId: string;
  customerId?: string;
  seats: ISeatSelection[];
  contactInfo: IContactInfo;
  subtotalPrice: number;
  discountAmount: number;
  totalPrice: number;
  status: BookingStatus;
  voucherCode?: string;
  holdExpiresAt?: string;
  isGuestBooking: boolean;
  tripSnapshot: {
    origin: string;
    destination: string;
    departureTime: string;
    arrivalTime: string;
    busType: string;
    operatorName: string;
  };
  createdAt: string;
  updatedAt: string;
}
