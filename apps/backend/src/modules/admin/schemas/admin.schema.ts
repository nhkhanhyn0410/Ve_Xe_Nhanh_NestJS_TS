import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { AdminRole } from '@ve_xe_nhanh_ts/shared-types';

export type AdminDocument = Admin & Document;

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
export class Admin {
  @Prop({ required: true, trim: true })
  fullName: string;

  @Prop({
    required: true,
    unique: true,
    index: true,
    lowercase: true,
    trim: true,
  })
  username: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true, select: false })
  password?: string;

  @Prop({ type: String, enum: AdminRole, default: AdminRole.SUPER_ADMIN })
  adminRole: AdminRole;

  @Prop()
  avatar?: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ select: false })
  refreshToken?: string;

  @Prop({ type: Date })
  lastLoginAt?: Date;
}

export const AdminSchema = SchemaFactory.createForClass(Admin);
AdminSchema.index({ email: 1 }, { unique: true });
