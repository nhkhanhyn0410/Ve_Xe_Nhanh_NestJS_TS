import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Bus, BusDocument } from './schemas/bus.schema';
import { CreateBusDto } from './dto/create-bus.dto';
import { UpdateBusDto } from './dto/update-bus.dto';
import { BusStatus, BusType, SystemRole } from '@ve_xe_nhanh_ts/shared-types';

export interface BusQuery {
  operatorId?: string;
  status?: BusStatus;
  busType?: BusType;
  busNumber?: string;
}

@Injectable()
export class BusesService {
  constructor(@InjectModel(Bus.name) private busModel: Model<BusDocument>) {}

  async create(operatorId: string, createDto: CreateBusDto): Promise<Bus> {
    const existingBus = await this.busModel.findOne({
      busNumber: createDto.busNumber.toUpperCase(),
    });
    if (existingBus) {
      throw new ConflictException('Biển số xe này đã được đăng ký');
    }

    const bus = new this.busModel({
      ...createDto,
      operatorId: new Types.ObjectId(operatorId),
    });
    return bus.save(); // save() will trigger Mongoose pre('save') hooks!
  }

  async findAll(query: BusQuery = {}): Promise<BusDocument[]> {
    const { operatorId, status, busType, busNumber } = query;

    const filter: {
      operatorId?: Types.ObjectId;
      status?: BusStatus;
      busType?: BusType;
      busNumber?: RegExp;
    } = {};

    if (operatorId && Types.ObjectId.isValid(operatorId)) {
      filter.operatorId = new Types.ObjectId(operatorId);
    }
    if (status) filter.status = status;
    if (busType) filter.busType = busType;

    if (busNumber) {
      // Biển số xe thường được lưu UPPERCASE, dùng regex 'i' là an toàn nhất
      filter.busNumber = new RegExp(busNumber, 'i');
    }

    const queryFilter = filter as unknown as Parameters<
      Model<BusDocument>['find']
    >[0];

    return this.busModel
      .find(queryFilter)
      .populate('operatorId', 'companyName')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(id: string): Promise<Bus> {
    const bus = await this.busModel
      .findById(id)
      .populate('operatorId', 'companyName phone')
      .exec();
    if (!bus) {
      throw new NotFoundException('Không tìm thấy xe');
    }
    return bus;
  }

  async update(
    id: string,
    operatorId: string,
    role: SystemRole,
    updateDto: UpdateBusDto,
  ): Promise<Bus> {
    const bus = await this.findOne(id);

    if (role !== SystemRole.ADMIN && bus.operatorId.toString() !== operatorId) {
      throw new ForbiddenException(
        'Bạn không có quyền sửa xe của nhà cung cấp khác',
      );
    }

    if (updateDto.busNumber && updateDto.busNumber !== bus.busNumber) {
      const existingBus = await this.busModel.findOne({
        busNumber: updateDto.busNumber.toUpperCase(),
      });
      if (existingBus) {
        throw new ConflictException('Biển số xe mới này đã tồn tại');
      }
    }

    // findByIdAndUpdate trigger pre('findOneAndUpdate') để count ghế
    const updatedBus = await this.busModel
      .findByIdAndUpdate(id, updateDto, { new: true })
      .exec();
    return updatedBus as unknown as Bus;
  }

  async remove(
    id: string,
    operatorId: string,
    role: SystemRole,
  ): Promise<void> {
    const bus = await this.findOne(id);

    if (role !== SystemRole.ADMIN && bus.operatorId.toString() !== operatorId) {
      throw new ForbiddenException(
        'Bạn không có quyền xóa xe của nhà cung cấp khác',
      );
    }

    await this.busModel.findByIdAndDelete(id).exec();
  }
}
