import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ICoordinates } from '@ve_xe_nhanh_ts/shared-types';

export type RouteDocument = Route & Document;

@Schema({ _id: true })
export class RoutePoint {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ trim: true })
  address: string;

  @Prop({
    type: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    required: true,
  })
  coordinates: ICoordinates;
}
export const RoutePointSchema = SchemaFactory.createForClass(RoutePoint);

@Schema({ _id: true })
export class RouteStop {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ trim: true })
  address: string;

  @Prop({
    type: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    required: true,
  })
  coordinates: ICoordinates;

  @Prop({ required: true, min: 1 })
  order: number;

  @Prop({ required: true, min: 0 })
  estimatedArrivalMinutes: number;

  @Prop({ required: true, min: 5, max: 120, default: 15 })
  stopDuration: number;
}
export const RouteStopSchema = SchemaFactory.createForClass(RouteStop);

@Schema({ timestamps: true })
export class Route {
  @Prop({
    type: Types.ObjectId,
    ref: 'BusOperator',
    required: true,
    index: true,
  })
  operatorId: Types.ObjectId;

  @Prop({ required: true, trim: true, maxlength: 200 })
  routeName: string;

  @Prop({ required: true, unique: true, uppercase: true, trim: true })
  routeCode: string;

  @Prop({ type: Types.ObjectId, ref: 'StopPoint', required: true, index: true })
  originId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'StopPoint', required: true, index: true })
  destinationId: Types.ObjectId;

  @Prop({ type: [RoutePointSchema], default: [] })
  pickupPoints: RoutePoint[];

  @Prop({ type: [RoutePointSchema], default: [] })
  dropoffPoints: RoutePoint[];

  @Prop({ type: [RouteStopSchema], default: [] })
  stops: RouteStop[];

  @Prop({ required: true, min: 0, max: 5000 })
  distance: number;

  @Prop({ required: true, min: 0, max: 2880 })
  estimatedDuration: number;

  @Prop({ default: true, index: true })
  isActive: boolean;
}

export const RouteSchema = SchemaFactory.createForClass(Route);
// Composite index for exact searches
RouteSchema.index({ originId: 1, destinationId: 1 });
