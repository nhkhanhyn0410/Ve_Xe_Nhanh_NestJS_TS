import { TicketStatus } from './enums';

export interface ITicket {
  id: string;
  ticketCode: string;
  bookingId: string;
  tripId: string;
  seatNumber: string;
  passengerName: string;
  passengerPhone: string;
  status: TicketStatus;
  tripInfo: {
    origin: string;
    destination: string;
    departureTime: string;
    arrivalTime: string;
    busType: string;
    busLicensePlate: string;
    operatorName: string;
  };
  price: number;
  createdAt: string;
}
