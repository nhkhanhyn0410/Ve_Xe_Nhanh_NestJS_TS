import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { TripStatus, JourneyStatus } from '@ve_xe_nhanh_ts/shared-types';
import { BusDocument } from '@modules/buses/schemas/bus.schema';

export type TripDocument = Trip & Document;

@Schema({ _id: false })
export class DynamicPricing {
  @Prop({ default: false })
  demandMultiplierEnabled: boolean;

  @Prop({ default: 80, min: 0, max: 100 })
  highDemandThreshold: number;

  @Prop({ default: 1.2, min: 1, max: 3 })
  highDemandMultiplier: number;

  @Prop({ default: 90, min: 0, max: 100 })
  veryHighDemandThreshold: number;

  @Prop({ default: 1.5, min: 1, max: 3 })
  veryHighDemandMultiplier: number;

  @Prop({ default: true })
  earlyBirdEnabled: boolean;

  @Prop({ default: 7, min: 1 })
  daysBeforeDeparture: number;

  @Prop({ default: 10, min: 0, max: 50 })
  discountPercentage: number;

  @Prop({ default: true })
  peakHoursEnabled: boolean;

  @Prop({ type: [Number] }) // e.g., [7, 8, 17, 18]
  peakHours: number[];

  @Prop({ default: 15, min: 0, max: 50 })
  peakHoursPremiumPercentage: number;

  @Prop({ default: true })
  weekendPremiumEnabled: boolean;

  @Prop({ default: 10, min: 0, max: 50 })
  weekendPremiumPercentage: number;
}
export const DynamicPricingSchema =
  SchemaFactory.createForClass(DynamicPricing);

@Schema({ _id: false })
export class BookedSeat {
  @Prop({ required: true })
  seatNumber: string;

  @Prop({ type: Types.ObjectId, ref: 'Booking', required: true })
  bookingId: Types.ObjectId;

  @Prop({ required: true })
  passengerName: string;
}
export const BookedSeatSchema = SchemaFactory.createForClass(BookedSeat);

@Schema({ _id: false })
export class JourneyHistory {
  @Prop({ type: String, enum: JourneyStatus, required: true })
  status: JourneyStatus;

  @Prop({ default: -1 })
  stopIndex: number;

  @Prop({ default: Date.now, required: true })
  timestamp: Date;

  @Prop({ type: Object })
  location?: { lat: number; lng: number };

  @Prop({ maxlength: 500 })
  notes?: string;

  @Prop({ type: Types.ObjectId })
  updatedBy?: Types.ObjectId;
}
export const JourneyHistorySchema =
  SchemaFactory.createForClass(JourneyHistory);

@Schema({ _id: false })
export class JourneyTracker {
  @Prop({ default: -1 })
  currentStopIndex: number;

  @Prop({ type: String, enum: JourneyStatus, default: JourneyStatus.PREPARING })
  currentStatus: JourneyStatus;

  @Prop({ type: [Number], default: [] })
  stoppedAt: number[];

  @Prop({ type: [JourneyHistorySchema], default: [] })
  statusHistory: JourneyHistory[];

  @Prop()
  actualDepartureTime?: Date;

  @Prop()
  actualArrivalTime?: Date;
}
export const JourneyTrackerSchema =
  SchemaFactory.createForClass(JourneyTracker);

@Schema({
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class Trip {
  @Prop({ type: Types.ObjectId, ref: 'Route', required: true, index: true })
  routeId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Bus', required: true, index: true })
  busId: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'BusOperator',
    required: true,
    index: true,
  })
  operatorId: Types.ObjectId;

  // OPTIONAL CREW
  @Prop({ type: Types.ObjectId })
  driverId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId })
  tripManagerId?: Types.ObjectId;

  @Prop({ required: true, index: true })
  departureTime: Date;

  @Prop({ required: true })
  arrivalTime: Date;

  @Prop({ required: true, min: 0 })
  basePrice: number;

  @Prop({ default: 0, min: 0, max: 100 })
  discount: number;

  @Prop({ required: true })
  finalPrice: number;

  @Prop({ type: DynamicPricingSchema })
  dynamicPricing?: DynamicPricing;

  @Prop({ required: true, min: 1 })
  totalSeats: number;

  @Prop({ required: true, min: 0 })
  availableSeats: number;

  @Prop({ type: [BookedSeatSchema], default: [] })
  bookedSeats: BookedSeat[];

  @Prop({
    type: String,
    enum: TripStatus,
    default: TripStatus.SCHEDULED,
    index: true,
  })
  status: TripStatus;

  @Prop({ type: JourneyTrackerSchema, default: () => ({}) })
  journey?: JourneyTracker;

  @Prop()
  cancelledAt?: Date;

  @Prop({ maxlength: 500 })
  cancelReason?: string;

  @Prop({ maxlength: 1000 })
  notes?: string;
}

export const TripSchema = SchemaFactory.createForClass(Trip);

// Indexes
TripSchema.index({ operatorId: 1, departureTime: 1 });
TripSchema.index({ routeId: 1, departureTime: 1 });
TripSchema.index({ status: 1, departureTime: 1, availableSeats: 1 });

// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
(TripSchema as any).pre(
  'validate',
  function (this: TripDocument, next: (err?: Error) => void) {
    if (this.departureTime && this.arrivalTime) {
      if (this.arrivalTime <= this.departureTime) {
        this.invalidate('arrivalTime', 'Giờ đến phải sau giờ khởi hành');
      }
    }
    next();
  },
);

// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
(TripSchema as any).pre(
  'save',
  async function (this: TripDocument, next: (err?: Error) => void) {
    // Calc final price
    if (
      this.isModified('basePrice') ||
      this.isModified('discount') ||
      !this.finalPrice
    ) {
      const discount = this.discount || 0;
      this.finalPrice = this.basePrice * (1 - discount / 100);
    }

    // Handle totalSeats initialization
    if (this.isNew) {
      if (!this.totalSeats) {
        const BusModel = this.model('Bus');
        const bus = (await BusModel.findById(this.busId)) as BusDocument;
        if (bus && bus.seatLayout && bus.seatLayout.totalSeats) {
          this.totalSeats = bus.seatLayout.totalSeats;
        } else {
          throw new Error('Bus không có thông tin sơ đồ ghế hợp lệ.');
        }
      }
      if (this.availableSeats === undefined || this.availableSeats === null) {
        this.availableSeats = this.totalSeats;
      }
    }

    // Update availableSeats if bookedSeats are modified
    if (this.isModified('bookedSeats')) {
      this.availableSeats = this.totalSeats - this.bookedSeats.length;
    }

    next();
  },
);
