import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { MongoIdPipe } from '@common/pipes/mongo-id.pipe';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { SystemRole, BookingStatus } from '@ve_xe_nhanh_ts/shared-types';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { JwtPayload } from '@common/interfaces/jwt-payload.interface';

@ApiTags('Bookings')
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(SystemRole.ADMIN, SystemRole.OPERATOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin/Nhà Xe] Xem danh sách đơn đặt vé' })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: BookingStatus })
  async findAll(@Query() query: any) {
    const data = await this.bookingsService.findAll(query);
    return { success: true, data };
  }

  @Get('/my-bookings')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Khách hàng] Lấy danh sách vé đã đặt của tôi' })
  async findMyBookings(@CurrentUser() user: JwtPayload, @Query() query: any) {
    const data = await this.bookingsService.findAll({
      ...query,
      userId: user.sub,
    });
    return { success: true, data };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Xem chi tiết đơn đặt vé (Kèm mảng vé chặng ngầm)' })
  async findOne(@Param('id', MongoIdPipe) id: string) {
    const data = await this.bookingsService.findOne(id);
    return { success: true, data };
  }

  // Khách hàng có thể Book mà không cần Login (Guest Booking)
  @Post()
  @ApiOperation({
    summary: 'Tạo đơn đặt vé mới (Có thể tạo Giỏ Hàng Nhỏ để Nối Chuyến)',
  })
  async create(
    @Body() createDto: CreateBookingDto,
    // Optional User
    @CurrentUser() user?: JwtPayload,
  ) {
    const userId = user ? user.sub : undefined;
    const data = await this.bookingsService.create(userId, createDto);
    return { success: true, data };
  }

  @Put(':id/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cập nhật trạng thái Booking (Thanh toán/Hủy)' })
  async updateStatus(
    @Param('id', MongoIdPipe) id: string,
    @Body('status') status: BookingStatus,
    @CurrentUser() user: JwtPayload,
  ) {
    const data = await this.bookingsService.updateStatus(
      id,
      status,
      user.sub,
      user.role as string,
    );
    return { success: true, data };
  }
}
