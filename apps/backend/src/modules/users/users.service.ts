import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserDocument, User } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async create(CreateUserDto: CreateUserDto): Promise<UserDocument> {
    const existing = await this.userModel.findOne({
      $or: [{ email: CreateUserDto.email }, { phone: CreateUserDto.phone }],
    });
    if (existing) {
      if (existing.email === CreateUserDto.email) {
        throw new ConflictException('Email đã được sử dụng');
      }

      if (existing.phone === CreateUserDto.phone) {
        throw new ConflictException('Số điện thoại đã được sử dụng');
      }
    }

    const hashedPassword = await bcrypt.hash(CreateUserDto.password, 12);
    const user = await this.userModel.create({
      ...CreateUserDto,
      password: hashedPassword,
    });
    return user;
  }

  async findById(id: string): Promise<UserDocument> {
    const user = await this.userModel.findById(id);
    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại');
    }
    return user;
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).select('+password').exec();
  }

  async findByPhone(phone: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ phone }).select('+password').exec();
  }

  async findByIdWithRefreshToken(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).select('+refreshToken').exec();
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<UserDocument> {
    const user = await this.userModel.findByIdAndUpdate(
      id,
      { $set: updateUserDto },
      { new: true },
    );
    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại');
    }
    return user;
  }

  async updateRefreshToken(
    id: string,
    refreshToken: string | null,
  ): Promise<void> {
    const hashedToken = refreshToken
      ? await bcrypt.hash(refreshToken, 12)
      : null;
    await this.userModel.findByIdAndUpdate(id, { refreshToken: hashedToken });
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(id, {
      lastLoginAt: new Date(),
      failedLoginAttempts: 0,
      lockUntil: null,
    });
  }

  async incrementFailedLogin(id: string): Promise<void> {
    const user = await this.userModel.findById(id);
    if (!user) return;

    const attempts = user.failedLoginAttempts + 1;
    const update: Partial<User> = { failedLoginAttempts: attempts };

    if (attempts >= 5) {
      update.lockUntil = new Date(Date.now() + 5 * 60 * 1000);
    }

    await this.userModel.findByIdAndUpdate(id, update);
  }

  isLocked(user: UserDocument): boolean {
    return !!(user.lockUntil && user.lockUntil > new Date());
  }
}
