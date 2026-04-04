import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { BusType, BusStatus, BusAmenity } from '@ve_xe_nhanh_ts/shared-types';

export type BusDocument = Bus & Document;

@Schema({ _id: false })
export class SeatLayout {
  @Prop({ required: true, enum: [1, 2] })
  floors: number;

  @Prop({ required: true, min: 1, max: 20 })
  rows: number;

  @Prop({ required: true, min: 1, max: 10 })
  columns: number;

  @Prop({ type: [[String]], required: true })
  layout: string[][];

  @Prop({ required: false })
  totalSeats: number;
}
export const SeatLayoutSchema = SchemaFactory.createForClass(SeatLayout);

@Schema({ _id: false })
export class RegistrationInfo {
  @Prop({ trim: true })
  certificateNumber?: string;

  @Prop({ min: 1 })
  payloadCapacity?: number;

  @Prop()
  expirationDate?: Date;

  @Prop()
  insuranceExpirationDate?: Date;

  @Prop({ trim: true })
  ownerName?: string;
}
export const RegistrationInfoSchema =
  SchemaFactory.createForClass(RegistrationInfo);

@Schema({
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class Bus {
  @Prop({
    type: Types.ObjectId,
    ref: 'BusOperator',
    required: true,
    index: true,
  })
  operatorId: Types.ObjectId;

  @Prop({
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    maxlength: 20,
  })
  busNumber: string;

  @Prop({ type: String, required: true, index: true })
  busType: BusType;

  @Prop({ type: SeatLayoutSchema, required: true })
  seatLayout: SeatLayout;

  @Prop({ type: [String], default: [] })
  amenities: BusAmenity[];

  @Prop({
    type: String,
    enum: BusStatus,
    default: BusStatus.ACTIVE,
    index: true,
  })
  status: BusStatus;

  // Optionals
  @Prop({ trim: true })
  description?: string;

  @Prop({ type: [String], default: [] })
  images?: string[];

  @Prop({ type: [String], default: [] })
  actualImages?: string[];

  @Prop({ type: RegistrationInfoSchema })
  registrationInfo?: RegistrationInfo;
}

export const BusSchema = SchemaFactory.createForClass(Bus);

// Indexes
BusSchema.index({ operatorId: 1, status: 1 });

// Virtuals
BusSchema.virtual('displayName').get(function () {
  return `${this.busNumber} (${this.busType})`;
});

BusSchema.virtual('isAvailable').get(function () {
  return this.status === BusStatus.ACTIVE;
});

// Hàm dùng chung cho việc tính toán tổng số ghế
function calculateTotalSeats(layout: string[][]): number {
  let count = 0;
  for (const row of layout) {
    for (const seat of row) {
      if (seat && typeof seat === 'string') {
        const s = seat.toUpperCase();
        if (
          s !== '' &&
          s !== 'DRIVER' &&
          s !== 'FLOOR_2' &&
          s !== 'BUS' &&
          s !== 'AISLE' &&
          !s.includes('AISLE')
        ) {
          count++;
        }
      }
    }
  }
  return count;
}

// Pre-save
BusSchema.pre('save', function (this: any, next: any) {
  if (this.seatLayout && this.seatLayout.layout) {
    this.seatLayout.totalSeats = calculateTotalSeats(this.seatLayout.layout);
  }
  next();
});

// Pre-findOneAndUpdate
BusSchema.pre('findOneAndUpdate', function (this: any, next: any) {
  const update = this.getUpdate();
  if (!update) return next();

  // NestJS/Mongoose có thể để update dict nguyên khối
  if (update.seatLayout && update.seatLayout.layout) {
    update.seatLayout.totalSeats = calculateTotalSeats(
      update.seatLayout.layout,
    );
  }
  // Xử lý cả trường hợp dùng $set
  if (update.$set && update.$set.seatLayout && update.$set.seatLayout.layout) {
    update.$set.seatLayout.totalSeats = calculateTotalSeats(
      update.$set.seatLayout.layout,
    );
  }
  next();
});
