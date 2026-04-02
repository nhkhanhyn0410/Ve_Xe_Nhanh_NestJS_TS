import { Prop, Schema } from '@nestjs/mongoose';
import { Document } from 'mongoose';

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
      delete ret.role;
      delete ret.refreshToken;
      return ret;
    },
  },
})
export class Admin {
  @Prop({ required: true, trim: true })
  adminName: string;
}
