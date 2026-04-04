import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Query, Types } from 'mongoose';
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
  if (!layout) return 0;
  const ignoredSeats = ['DRIVER', 'FLOOR_2', 'BUS', 'AISLE'];
  return layout.flat().filter((seat) => {
    if (!seat || typeof seat !== 'string') return false;
    const s = seat.toUpperCase().trim();
    return s !== '' && !ignoredSeats.includes(s) && !s.includes('AISLE');
  }).length;
}

// Pre-save
// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
(BusSchema as any).pre(
  'save',
  function (this: BusDocument, next: (err?: Error) => void) {
    if (this.isModified('seatLayout') && this.seatLayout?.layout) {
      this.seatLayout.totalSeats = calculateTotalSeats(this.seatLayout.layout);
    }
    next();
  },
);

interface BusUpdate {
  seatLayout?: SeatLayout;
  $set?: {
    seatLayout?: SeatLayout;
  };
}

// Pre-findOneAndUpdate
// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
(BusSchema as any).pre(
  'findOneAndUpdate',
  function (this: Query<unknown, BusDocument>, next: (err?: Error) => void) {
    const update = this.getUpdate() as BusUpdate;
    if (!update) return next();

    // Kiểm tra cả update trực tiếp và $set
    const seatLayout = update.seatLayout || update.$set?.seatLayout;

    if (seatLayout?.layout) {
      const totalSeats = calculateTotalSeats(seatLayout.layout);
      if (update.seatLayout) {
        update.seatLayout.totalSeats = totalSeats;
      }
      if (update.$set?.seatLayout) {
        update.$set.seatLayout.totalSeats = totalSeats;
      }
    }
    next();
  },
);
