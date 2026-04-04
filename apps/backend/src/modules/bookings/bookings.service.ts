import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Booking, BookingDocument } from './schemas/booking.schema';
import { CreateBookingDto } from './dto/create-booking.dto';
import {
  SystemRole,
  BookingStatus,
  JourneyType,
} from '@ve_xe_nhanh_ts/shared-types';

@Injectable()
export class BookingsService {
  constructor(
    @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
  ) {}

  private generateBookingCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'BKG-';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  async create(
    userId: string | undefined,
    createDto: CreateBookingDto,
  ): Promise<Booking> {
    // In Phase 2: Add Redis Distributed Lock Here before proceeding
    // In Phase 3: Integrate with real Payment module

    // Generate unique code and Tickets
    const bookingCode = this.generateBookingCode();

    // Generate segment ticket codes
    const tickets = createDto.tickets.map((t, index) => ({
      ...t,
      ticketCode: `${bookingCode}-${index + 1}`,
      operatorId: new Types.ObjectId(t.operatorId),
      tripId: new Types.ObjectId(t.tripId),
      pickupPointId: new Types.ObjectId(t.pickupPointId),
      dropoffPointId: new Types.ObjectId(t.dropoffPointId),
    }));

    // If there's transit info, make sure it has the proper ObjectIds
    let transitInfo = undefined;
    if (createDto.transitInfo) {
      transitInfo = {
        ...createDto.transitInfo,
        hubStopPointId: createDto.transitInfo.hubStopPointId
          ? new Types.ObjectId(createDto.transitInfo.hubStopPointId)
          : undefined,
      };
    }

    const booking = new this.bookingModel({
      bookingCode,
      userId: userId ? new Types.ObjectId(userId) : undefined,
      passengerInfo: createDto.passengerInfo,
      journeyType: createDto.journeyType,
      tickets,
      transitInfo,
      totalAmount: createDto.totalAmount,
      notes: createDto.notes,
    });

    return booking.save();
  }

  async findAll(query: any = {}) {
    const filter: any = {};
    if (query.userId) filter.userId = new Types.ObjectId(query.userId);
    if (query.bookingCode) filter.bookingCode = query.bookingCode;
    if (query.status) filter.status = query.status;

    return this.bookingModel.find(filter).sort({ createdAt: -1 }).exec();
  }

  async findOne(id: string): Promise<Booking> {
    const booking = await this.bookingModel
      .findById(id)
      .populate('tickets.operatorId', 'businessName')
      .populate('tickets.pickupPointId', 'name address')
      .populate('tickets.dropoffPointId', 'name address')
      .exec();

    if (!booking) {
      throw new NotFoundException('Không tìm thấy đơn đặt vé');
    }
    return booking;
  }

  async updateStatus(
    id: string,
    status: BookingStatus,
    userId: string,
    role: string,
  ): Promise<Booking> {
    const booking = await this.findOne(id);

    if (role === SystemRole.USER && booking.userId?.toString() !== userId) {
      throw new ForbiddenException(
        'Bạn không có quyền cập nhật đơn đặt vé này',
      );
    }

    booking.status = status;
    return booking.save();
  }
}
