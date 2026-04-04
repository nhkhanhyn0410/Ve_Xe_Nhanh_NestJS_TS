import { TripStatus, JourneyStatus } from './enums.js';

export interface IDynamicPricing {
  demandMultiplierEnabled?: boolean;
  highDemandThreshold?: number;
  highDemandMultiplier?: number;
  veryHighDemandThreshold?: number;
  veryHighDemandMultiplier?: number;

  earlyBirdEnabled?: boolean;
  daysBeforeDeparture?: number;
  discountPercentage?: number;

  peakHoursEnabled?: boolean;
  peakHours?: number[];
  peakHoursPremiumPercentage?: number;

  weekendPremiumEnabled?: boolean;
  weekendPremiumPercentage?: number;
}

export interface IBookedSeat {
  seatNumber: string;
  bookingId: string;
  passengerName: string;
}

export interface IJourneyHistory {
  status: JourneyStatus;
  stopIndex: number;
  timestamp: string;
  location?: { lat: number; lng: number };
  notes?: string;
  updatedBy?: string;
}

export interface IJourneyTracker {
  currentStopIndex: number;
  currentStatus: JourneyStatus;
  stoppedAt: number[];
  statusHistory: IJourneyHistory[];
  actualDepartureTime?: string;
  actualArrivalTime?: string;
}

export interface ITrip {
  id: string;
  routeId: string;
  busId: string;
  operatorId: string;
  
  driverId?: string;
  tripManagerId?: string;

  departureTime: string;
  arrivalTime: string;

  basePrice: number;
  discount: number;
  finalPrice: number;
  dynamicPricing?: IDynamicPricing;

  totalSeats: number;
  availableSeats: number;
  bookedSeats: IBookedSeat[];

  status: TripStatus;
  journey?: IJourneyTracker;

  cancelReason?: string;
  cancelledAt?: string;

  notes?: string;
  createdAt: string;
  updatedAt: string;
}
