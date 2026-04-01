import { TripStatus, BusType } from './enums';

export interface ITrip {
  id: string;
  route: {
    origin: string;
    destination: string;
    distance: number;
    estimatedTime: number;
  };
  operator: {
    id: string;
    companyName: string;
    logo?: string;
    rating: number;
  };
  bus: {
    type: BusType;
    amenities: string[];
    totalSeats: number;
  };
  departureTime: string;
  arrivalTime: string;
  basePrice: number;
  availableSeats: number;
  status: TripStatus;
}

export interface ISearchTripParams {
  from: string;
  to: string;
  date: string;
  passengers: number;
  busType?: BusType;
  sortBy?: 'price_asc' | 'price_desc' | 'departure_asc' | 'rating';
  page?: number;
  limit?: number;
}
