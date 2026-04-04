import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { BookingStatus, PaymentMethod, PaymentStatus, TicketStatus, JourneyType } from '@ve_xe_nhanh_ts/shared-types';

export type BookingDocument = Booking & Document;

@Schema({ _id: false })
export class PassengerInfo {
  @Prop({ required: true })
  fullName: string;

  @Prop({ required: true })
  phone: string;

  @Prop()
  email?: string;

  @Prop()
  identityCard?: string;
}
export const PassengerInfoSchema = SchemaFactory.createForClass(PassengerInfo);

@Schema({ _id: false })
export class TransitInstruction {
  @Prop({ required: true, default: false })
  requiresTransit: boolean;

  @Prop()
  address?: string;

  @Prop({ type: Object })
  coordinates?: { lat: number; lng: number };

  @Prop()
  transitNote?: string;

  @Prop({ type: Types.ObjectId, ref: 'StopPoint' })
  hubStopPointId?: Types.ObjectId;
}
export const TransitInstructionSchema = SchemaFactory.createForClass(TransitInstruction);

@Schema({ _id: false })
export class SegmentTicket {
  @Prop({ required: true, unique: true, index: true })
  ticketCode: string;

  @Prop({ type: Types.ObjectId, ref: 'Operator', required: true })
  operatorId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Trip', required: true })
  tripId: Types.ObjectId;

  @Prop({ required: true })
  seatNumber: string;

  @Prop({ type: Types.ObjectId, ref: 'StopPoint', required: true })
  pickupPointId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'StopPoint', required: true })
  dropoffPointId: Types.ObjectId;

  @Prop({ required: true })
  departureTime: Date;

  @Prop({ required: true })
  arrivalTime: Date;

  @Prop({ required: true, min: 0 })
  price: number;

  @Prop({ type: String, enum: TicketStatus, default: TicketStatus.VALID })
  status: TicketStatus;
}
export const SegmentTicketSchema = SchemaFactory.createForClass(SegmentTicket);

@Schema({ timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } })
export class Booking {
  @Prop({ required: true, unique: true, index: true })
  bookingCode: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  userId?: Types.ObjectId;

  @Prop({ type: PassengerInfoSchema, required: true })
  passengerInfo: PassengerInfo;

  @Prop({ type: String, enum: JourneyType, required: true })
  journeyType: JourneyType;

  @Prop({ type: [SegmentTicketSchema], required: true, validate: [arrayLimit, 'A booking must have at least one ticket segment.'] })
  tickets: SegmentTicket[];

  @Prop({ type: TransitInstructionSchema })
  transitInfo?: TransitInstruction;

  @Prop({ required: true, min: 0 })
  totalAmount: number;

  @Prop({ min: 0 })
  originalAmount?: number;

  @Prop({ min: 0 })
  discountAmount?: number;

  @Prop()
  couponCode?: string;

  @Prop({ type: String, enum: BookingStatus, default: BookingStatus.PENDING, index: true })
  status: BookingStatus;

  @Prop({ type: String, enum: PaymentMethod })
  paymentMethod?: PaymentMethod;

  @Prop({ type: String, enum: PaymentStatus, default: PaymentStatus.CREATED })
  paymentStatus: PaymentStatus;

  @Prop()
  cancelReason?: string;

  @Prop()
  cancelledAt?: Date;

  @Prop({ maxlength: 500 })
  notes?: string;
}

function arrayLimit(val: SegmentTicket[]) {
  return val.length > 0;
}

export const BookingSchema = SchemaFactory.createForClass(Booking);

// Indexes for fast lookup
BookingSchema.index({ 'passengerInfo.phone': 1 });
BookingSchema.index({ userId: 1, createdAt: -1 });
BookingSchema.index({ 'tickets.operatorId': 1 });
BookingSchema.index({ 'tickets.tripId': 1 });
