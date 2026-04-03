import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StopPointsService } from './stop-points.service';
import { StopPointsController } from './stop-points.controller';
import { StopPoint, StopPointSchema } from './schemas/stop-point.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: StopPoint.name, schema: StopPointSchema },
    ]),
  ],
  controllers: [StopPointsController],
  providers: [StopPointsService],
  exports: [StopPointsService],
})
export class StopPointsModule {}
