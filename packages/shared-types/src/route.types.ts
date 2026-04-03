import { ICoordinates, IStopPoint } from './stop-point.types.js';

// Embedded point for pickup/dropoff with flexible names
export interface IRoutePoint {
  _id?: string;
  name: string; // Tên điểm (VD: VP Hoàng Long, Ngã 4 Hàng Xanh)
  address: string;
  coordinates: ICoordinates;
}

// Embedded point for rest stops
export interface IRouteStop {
  _id?: string;
  name: string;
  address: string;
  coordinates: ICoordinates;
  order: number;
  estimatedArrivalMinutes: number; // Số phút ước tính từ lúc xuất phát
  stopDuration: number; // Thời gian dừng (phút)
}

export interface IRoute {
  id: string;
  operatorId: string; // Tham chiếu sang BusOperator
  
  routeName: string;
  routeCode: string; // VD: HN-SG-01

  // Tham chiếu (Ref) tới collection StopPoints
  originId: string | IStopPoint; 
  destinationId: string | IStopPoint;

  pickupPoints: IRoutePoint[];
  dropoffPoints: IRoutePoint[];
  stops: IRouteStop[];

  distance: number; // Km
  estimatedDuration: number; // Phút

  isActive: boolean;
  
  createdAt: string;
  updatedAt: string;

  // Virtuals
  routeDescription?: string;
  estimatedDurationHours?: string | number;
}
