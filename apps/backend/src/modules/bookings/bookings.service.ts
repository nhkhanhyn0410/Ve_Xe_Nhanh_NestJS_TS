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
  // JourneyType,
} from '@ve_xe_nhanh_ts/shared-types';

export interface BookingQuery {
  userId?: string;
  bookingCode?: string;
  status?: BookingStatus;
}

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
    createBookingDto: CreateBookingDto,
  ): Promise<BookingDocument> {
    // In Phase 2: Add Redis Distributed Lock Here before proceeding
    // In Phase 3: Integrate with real Payment module

    // Generate unique code and Tickets
    const bookingCode = this.generateBookingCode();

    // Generate segment ticket codes
    const tickets = createBookingDto.tickets.map((t, index) => ({
      ...t,
      ticketCode: `${bookingCode}-${index + 1}`,
      operatorId: new Types.ObjectId(t.operatorId),
      tripId: new Types.ObjectId(t.tripId),
      pickupPointId: new Types.ObjectId(t.pickupPointId),
      dropoffPointId: new Types.ObjectId(t.dropoffPointId),
      departureTime: new Date(t.departureTime),
      arrivalTime: new Date(t.arrivalTime),
    }));

    // If there's transit info, make sure it has the proper ObjectIds
    let transitInfo = undefined;
    if (createBookingDto.transitInfo) {
      transitInfo = {
        ...createBookingDto.transitInfo,
        hubStopPointId: createBookingDto.transitInfo.hubStopPointId
          ? new Types.ObjectId(createBookingDto.transitInfo.hubStopPointId)
          : undefined,
      };
    }

    const booking = await this.bookingModel.create({
      bookingCode,
      userId: userId ? new Types.ObjectId(userId) : undefined,
      passengerInfo: createBookingDto.passengerInfo,
      journeyType: createBookingDto.journeyType,
      tickets,
      transitInfo,
      totalAmount: createBookingDto.totalAmount,
      notes: createBookingDto.notes,
    });

    return booking;
  }

  async findAll(query: BookingQuery = {}): Promise<BookingDocument[]> {
    const { userId, bookingCode, status } = query;

    const filter: {
      userId?: Types.ObjectId;
      bookingCode?: string;
      status?: BookingStatus;
    } = {};
    if (userId) filter.userId = new Types.ObjectId(userId);
    if (bookingCode) filter.bookingCode = bookingCode;
    if (status) filter.status = status;

    return this.bookingModel.find(filter).sort({ createdAt: -1 }).exec();
  }

  async findOne(id: string): Promise<BookingDocument> {
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
    role: SystemRole,
  ): Promise<BookingDocument> {
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
