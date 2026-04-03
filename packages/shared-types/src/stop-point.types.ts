import { StopPointType } from './enums.js';

export interface ICoordinates {
  lat: number;
  lng: number;
}

export interface IStopPoint {
  id: string;
  name: string;
  type: StopPointType;
  city: string;
  province: string;
  address: string;
  coordinates: ICoordinates;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
