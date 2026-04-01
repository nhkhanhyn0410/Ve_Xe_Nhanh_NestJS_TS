import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { LoyaltyTier, Gender } from '@ve_xe_nhanh_ts/shared-types';

export type UserDocument = User & Document;

@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (_doc, ret: Record<string, any>) => {
      ret.id = String(ret._id);
      delete ret._id;
      delete ret.__v;
      delete ret.password;
      delete ret.refreshToken;
      return ret;
    },
  },
})
export class User {
  @Prop({ required: true, trim: true })
  fullName: string;

  @Prop({ required: true })
  dateOfBirth: Date;

  @Prop({ type: String, enum: Gender, required: true })
  gender: Gender;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ unique: true, trim: true, sparse: true })
  phone?: string;

  @Prop({ select: false })
  password?: string;

  @Prop()
  avatar?: string;

  @Prop({ default: false })
  isEmailVerified: boolean;

  @Prop({ default: false })
  isPhoneVerified: boolean;

  @Prop({ default: false })
  isBlocked: boolean;

  @Prop({ default: 0 })
  loyaltyPoints: number;

  @Prop({ type: String, enum: LoyaltyTier, default: LoyaltyTier.BRONZE })
  loyaltyTier: LoyaltyTier;

  @Prop({ default: 0 })
  totalSpent: number;

  @Prop({ default: 0 })
  totalTrips: number;

  @Prop({ select: false })
  refreshToken?: string;

  @Prop({ type: Date })
  lastLoginAt?: Date;

  @Prop({ default: 0 })
  failedLoginAttempts: number;

  @Prop({ type: Date })
  lockUntil?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ phone: 1 }, { sparse: true });
