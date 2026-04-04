import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BusesService } from './buses.service';
import { BusesController } from './buses.controller';
import { Bus, BusSchema } from './schemas/bus.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Bus.name, schema: BusSchema }])],
  controllers: [BusesController],
  providers: [BusesService],
  exports: [BusesService],
})
export class BusesModule {}
