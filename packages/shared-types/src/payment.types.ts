import { PaymentMethod, PaymentStatus } from './enums';

export interface IPayment {
  id: string;
  paymentCode: string;
  bookingId: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  paymentUrl?: string;
  paidAt?: string;
  createdAt: string;
}
