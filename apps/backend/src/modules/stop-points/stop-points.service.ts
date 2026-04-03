import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { StopPoint, StopPointDocument } from './schemas/stop-point.schema';
import { CreateStopPointDto } from './dto/create-stop-point.dto';
import { UpdateStopPointDto } from './dto/update-stop-point.dto';
import { StopPointType } from '@ve_xe_nhanh_ts/shared-types';

export interface StopPointQuery {
  isActive?: string | boolean;
  city?: string;
  type?: StopPointType;
  search?: string;
}

@Injectable()
export class StopPointsService {
  constructor(
    @InjectModel(StopPoint.name)
    private stopPointModel: Model<StopPointDocument>,
  ) {}

  async create(createDto: CreateStopPointDto): Promise<StopPoint> {
    return this.stopPointModel.create(createDto);
  }

  async findAll(query: StopPointQuery = {}): Promise<StopPointDocument[]> {
    const { isActive, city, type, search } = query;

    // Khởi tạo filter với kiểu tường minh để tránh lỗi linter không resolve được FilterQuery
    const filter: {
      isActive?: boolean;
      city?: { $regex: string; $options: string };
      type?: StopPointType;
      $text?: { $search: string };
    } = {};

    if (isActive !== undefined && isActive !== '') {
      filter.isActive = isActive === 'true' || isActive === true;
    }

    if (city) {
      filter.city = { $regex: city, $options: 'i' };
    }

    if (type) {
      filter.type = type;
    }

    if (search) {
      filter.$text = { $search: search };
    }

    const queryFilter = filter as unknown as Parameters<
      Model<StopPointDocument>['find']
    >[0];

    return this.stopPointModel
      .find(queryFilter)
      .sort({ province: 1, city: 1, name: 1 })
      .exec();
  }

  async findOne(id: string): Promise<StopPoint> {
    const stopPoint = await this.stopPointModel.findById(id).exec();
    if (!stopPoint) {
      throw new NotFoundException('Không tìm thấy điểm dừng');
    }
    return stopPoint;
  }

  async update(id: string, updateDto: UpdateStopPointDto): Promise<StopPoint> {
    const stopPoint = await this.stopPointModel
      .findByIdAndUpdate(id, updateDto, { new: true })
      .exec();
    if (!stopPoint) {
      throw new NotFoundException('Không tìm thấy điểm dừng');
    }
    return stopPoint;
  }

  async remove(id: string): Promise<void> {
    const result = await this.stopPointModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException('Không tìm thấy điểm dừng');
    }
  }
}
