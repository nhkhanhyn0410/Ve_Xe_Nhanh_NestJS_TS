import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Admin, AdminDocument } from './schemas/admin.schema';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AdminService {
  constructor(@InjectModel(Admin.name) private adminModel: Model<AdminDocument>) {}

  async findByEmail(email: string): Promise<AdminDocument | null> {
    return this.adminModel.findOne({ email }).select('+password').exec();
  }

  async findByUsername(username: string): Promise<AdminDocument | null> {
    return this.adminModel.findOne({ username }).select('+password').exec();
  }

  async findById(id: string): Promise<AdminDocument> {
    const admin = await this.adminModel.findById(id);
    if (!admin) {
      throw new NotFoundException('Quản trị viên không tồn tại');
    }
    return admin;
  }

  async findByIdWithRefreshToken(id: string): Promise<AdminDocument | null> {
    return this.adminModel.findById(id).select('+refreshToken').exec();
  }

  async updateRefreshToken(id: string, refreshToken: string | null): Promise<void> {
    const hashedToken = refreshToken ? await bcrypt.hash(refreshToken, 12) : null;
    await this.adminModel.findByIdAndUpdate(id, { refreshToken: hashedToken });
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.adminModel.findByIdAndUpdate(id, {
      lastLoginAt: new Date(),
    });
  }
}
