import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { StopPointType, ICoordinates } from '@ve_xe_nhanh_ts/shared-types';

export type StopPointDocument = StopPoint & Document;

@Schema({ timestamps: true })
export class StopPoint {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ type: String, enum: StopPointType, default: StopPointType.POINT })
  type: StopPointType;

  @Prop({ required: true, trim: true })
  city: string;

  @Prop({ required: true, trim: true })
  province: string;

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

  @Prop({ default: true })
  isActive: boolean;
}

export const StopPointSchema = SchemaFactory.createForClass(StopPoint);
StopPointSchema.index({ city: 1, type: 1 });
StopPointSchema.index({ name: 'text', city: 'text' });
