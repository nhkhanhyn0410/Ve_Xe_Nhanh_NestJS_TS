import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Trip, TripDocument } from './schemas/trip.schema';
import { CreateTripDto } from './dto/create-trip.dto';
import { UpdateTripDto } from './dto/update-trip.dto';
import { SystemRole } from '@ve_xe_nhanh_ts/shared-types';

@Injectable()
export class TripsService {
  constructor(@InjectModel(Trip.name) private tripModel: Model<TripDocument>) {}

  private async checkBusOverlap(
    busId: string,
    departureTime: string | Date,
    arrivalTime: string | Date,
    excludeTripId?: string,
  ): Promise<void> {
    const depTime = new Date(departureTime);
    const arrTime = new Date(arrivalTime);

    if (arrTime <= depTime) {
      throw new BadRequestException('Giờ đến phải sau giờ khởi hành');
    }

    const query: any = {
      busId: new Types.ObjectId(busId),
      $or: [
        {
          departureTime: { $lt: arrTime },
          arrivalTime: { $gt: depTime },
        },
      ],
      status: { $ne: 'cancelled' },
    };

    if (excludeTripId) {
      query._id = { $ne: new Types.ObjectId(excludeTripId) };
    }

    const overlappingTrip = await this.tripModel.findOne(query);

    if (overlappingTrip) {
      throw new ConflictException(
        `Chiếc xe này đã được xếp lịch chạy trong khoảng thời gian từ ${overlappingTrip.departureTime.toLocaleString()} đến ${overlappingTrip.arrivalTime.toLocaleString()}`,
      );
    }
  }

  async create(operatorId: string, createDto: CreateTripDto): Promise<Trip> {
    await this.checkBusOverlap(
      createDto.busId,
      createDto.departureTime,
      createDto.arrivalTime,
    );

    const trip = new this.tripModel({
      ...createDto,
      operatorId: new Types.ObjectId(operatorId),
    });

    // Mongoose pre-save hook will pull `totalSeats` and calculate `finalPrice`
    return trip.save();
  }

  async findAll(query: any = {}) {
    const filter: any = {};
    if (query.operatorId)
      filter.operatorId = new Types.ObjectId(query.operatorId);
    if (query.routeId) filter.routeId = new Types.ObjectId(query.routeId);
    if (query.busId) filter.busId = new Types.ObjectId(query.busId);
    if (query.status) filter.status = query.status;

    // Filtering by date
    if (query.date) {
      const startOfDay = new Date(query.date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(query.date);
      endOfDay.setHours(23, 59, 59, 999);
      filter.departureTime = { $gte: startOfDay, $lte: endOfDay };
    }

    return this.tripModel
      .find(filter)
      .populate('routeId')
      .populate('busId', 'busNumber busType')
      .sort({ departureTime: 1 })
      .exec();
  }

  async findOne(id: string): Promise<Trip> {
    const trip = await this.tripModel
      .findById(id)
      .populate('routeId')
      .populate('busId', 'busNumber busType seatLayout')
      .exec();

    if (!trip) {
      throw new NotFoundException('Không tìm thấy chuyến xe');
    }
    return trip;
  }

  async update(
    id: string,
    operatorId: string,
    role: string,
    updateDto: UpdateTripDto,
  ): Promise<Trip> {
    const trip = await this.findOne(id);

    if (
      role !== SystemRole.ADMIN &&
      trip.operatorId.toString() !== operatorId
    ) {
      throw new ForbiddenException(
        'Bạn không có quyền sửa chuyến xe của nhà cung cấp khác',
      );
    }

    // Check time overlap if time or bus is changed
    const newBusId = updateDto.busId || trip.busId.toString();
    const newDep = updateDto.departureTime || trip.departureTime;
    const newArr = updateDto.arrivalTime || trip.arrivalTime;

    if (updateDto.busId || updateDto.departureTime || updateDto.arrivalTime) {
      await this.checkBusOverlap(newBusId, newDep, newArr, id);
    }

    return this.tripModel
      .findByIdAndUpdate(id, updateDto, { new: true })
      .exec() as unknown as Trip;
  }

  async remove(id: string, operatorId: string, role: string): Promise<void> {
    const trip = await this.findOne(id);

    if (
      role !== SystemRole.ADMIN &&
      trip.operatorId.toString() !== operatorId
    ) {
      throw new ForbiddenException(
        'Bạn không có quyền xóa chuyến xe của nhà cung cấp khác',
      );
    }

    await this.tripModel.findByIdAndDelete(id).exec();
  }
}
