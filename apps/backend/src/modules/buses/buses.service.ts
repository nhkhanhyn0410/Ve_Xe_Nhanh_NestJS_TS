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
import { SystemRole } from '@ve_xe_nhanh_ts/shared-types';

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

  async findAll(query: any = {}) {
    const filter: any = {};
    if (query.operatorId)
      filter.operatorId = new Types.ObjectId(query.operatorId);
    if (query.status) filter.status = query.status;
    if (query.busType) filter.busType = query.busType;
    if (query.busNumber) filter.busNumber = new RegExp(query.busNumber, 'i');

    return this.busModel
      .find(filter)
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
    role: string,
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

  async remove(id: string, operatorId: string, role: string): Promise<void> {
    const bus = await this.findOne(id);

    if (role !== SystemRole.ADMIN && bus.operatorId.toString() !== operatorId) {
      throw new ForbiddenException(
        'Bạn không có quyền xóa xe của nhà cung cấp khác',
      );
    }

    await this.busModel.findByIdAndDelete(id).exec();
  }
}
