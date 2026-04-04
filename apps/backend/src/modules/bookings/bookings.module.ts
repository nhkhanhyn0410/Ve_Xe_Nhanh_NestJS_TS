import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Booking, BookingSchema } from './schemas/booking.schema';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { SeatLockService } from './seat-lock.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Booking.name, schema: BookingSchema }]),
  ],
  controllers: [BookingsController],
  providers: [BookingsService, SeatLockService],
  exports: [BookingsService, SeatLockService],
})
export class BookingsModule {}
