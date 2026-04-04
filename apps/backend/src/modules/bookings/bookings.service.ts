import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Booking, BookingDocument } from './schemas/booking.schema';
import { CreateBookingDto } from './dto/create-booking.dto';
import { SeatLockService, SeatLockRequest } from './seat-lock.service';
import { SystemRole, BookingStatus } from '@ve_xe_nhanh_ts/shared-types';

export interface BookingQuery {
  userId?: string;
  bookingCode?: string;
  status?: BookingStatus;
}

@Injectable()
export class BookingsService {
  constructor(
    @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
    private readonly seatLockService: SeatLockService,
  ) {}

  private generateBookingCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'BKG-';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * Tạo đơn đặt vé mới.
   *
   * Luồng xử lý:
   * 1. Khóa nguyên tử tất cả ghế trên Redis (Chống Overbooking).
   * 2. Ghi Booking vào MongoDB.
   * 3. Nếu ghi DB thất bại -> Rollback (giải phóng ghế trên Redis).
   *
   * Trong trường hợp Cross-Operator Transfer (SGN->HN xe A + HN->HP xe B),
   * mảng `seats` sẽ chứa ghế của CẢ 2 chuyến. Redis sẽ khóa đồng thời
   * cả 2 ghế. Nếu 1 ghế fail thì ghế kia cũng bị rollback.
   */
  async create(
    userId: string | undefined,
    createBookingDto: CreateBookingDto,
  ): Promise<BookingDocument> {
    // Xây dựng holderId: userId nếu đã login, hoặc SĐT nếu Guest
    const holderId = userId ?? `guest_${createBookingDto.passengerInfo.phone}`;

    // Bước 1: Chuẩn bị danh sách ghế cần khóa từ mảng tickets
    const seatsToLock: SeatLockRequest[] = createBookingDto.tickets.map(
      (t) => ({
        tripId: t.tripId,
        seatNumber: t.seatNumber,
      }),
    );

    // Bước 2: Khóa nguyên tử tất cả ghế trên Redis (10 phút TTL)
    // Nếu bất kỳ ghế nào đã bị khóa -> ConflictException + Rollback tự động
    await this.seatLockService.lockSeats(seatsToLock, holderId);

    // Bước 3: Ghi Booking vào MongoDB
    try {
      const bookingCode = this.generateBookingCode();

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
    } catch (error: unknown) {
      // Bước 4 (Rollback): Nếu ghi DB lỗi -> giải phóng ghế trên Redis
      await this.seatLockService.releaseSeats(seatsToLock, holderId);
      throw error;
    }
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

  /**
   * Cập nhật trạng thái Booking.
   * Khi CANCELLED -> Giải phóng ghế trên Redis để người khác có thể mua.
   */
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

    // Nếu huỷ đơn -> Giải phóng tất cả ghế đang bị khóa trên Redis
    if (status === BookingStatus.CANCELLED) {
      const holderId =
        booking.userId?.toString() ?? `guest_${booking.passengerInfo.phone}`;
      const seatsToRelease: SeatLockRequest[] = booking.tickets.map((t) => ({
        tripId: t.tripId.toString(),
        seatNumber: t.seatNumber,
      }));
      await this.seatLockService.releaseSeats(seatsToRelease, holderId);
    }

    booking.status = status;
    return booking.save();
  }

  /**
   * Lấy trạng thái Real-time của toàn bộ ghế trên 1 chuyến:
   * - Ghế đã bán (Từ MongoDB)
   * - Ghế đang bị HOLD (Từ Redis)
   * Phục vụ Frontend render sơ đồ ghế.
   */
  async getSeatAvailability(
    tripId: string,
    allSeatNumbers: readonly string[],
  ): Promise<{
    readonly booked: readonly string[];
    readonly held: readonly string[];
    readonly available: readonly string[];
  }> {
    // Lấy ghế đã được Đặt Cọc/Mua từ MongoDB
    const bookings = await this.bookingModel
      .find({
        'tickets.tripId': new Types.ObjectId(tripId),
        status: { $nin: [BookingStatus.CANCELLED, BookingStatus.EXPIRED] },
      })
      .exec();

    const bookedSeats = new Set<string>();
    for (const booking of bookings) {
      for (const ticket of booking.tickets) {
        if (ticket.tripId.toString() === tripId) {
          bookedSeats.add(ticket.seatNumber);
        }
      }
    }

    // Lấy ghế đang bị HOLD từ Redis
    const remainingSeats = allSeatNumbers.filter((s) => !bookedSeats.has(s));
    const heldSeats = await this.seatLockService.getLockedSeats(
      tripId,
      remainingSeats,
    );
    const heldSet = new Set(heldSeats);

    // Ghế available = Không nằm trong booked và không nằm trong held
    const available = remainingSeats.filter((s) => !heldSet.has(s));

    return {
      booked: Array.from(bookedSeats),
      held: Array.from(heldSet),
      available,
    };
  }
}
