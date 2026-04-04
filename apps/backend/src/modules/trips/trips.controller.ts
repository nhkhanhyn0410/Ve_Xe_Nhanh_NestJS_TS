import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { TripsService } from './trips.service';
import { CreateTripDto } from './dto/create-trip.dto';
import { UpdateTripDto } from './dto/update-trip.dto';
import { MongoIdPipe } from '@common/pipes/mongo-id.pipe';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { SystemRole, TripStatus } from '@ve_xe_nhanh_ts/shared-types';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { JwtPayload } from '@common/interfaces/jwt-payload.interface';

@ApiTags('Trips')
@Controller('trips')
export class TripsController {
  constructor(private readonly tripsService: TripsService) {}

  @Get()
  @ApiOperation({
    summary:
      'Lấy danh sách các chuyến xe (Có thể dùng làm API tìm vé cho User)',
  })
  @ApiQuery({ name: 'operatorId', required: false })
  @ApiQuery({ name: 'routeId', required: false })
  @ApiQuery({ name: 'busId', required: false })
  @ApiQuery({ name: 'date', required: false, description: 'YYYY-MM-DD' })
  @ApiQuery({ name: 'status', required: false, enum: TripStatus })
  async findAll(@Query() query: any) {
    const data = await this.tripsService.findAll(query);
    return { success: true, data };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Xem chi tiết chuyến xe (sơ đồ ghế thực tế)' })
  async findOne(@Param('id', MongoIdPipe) id: string) {
    const data = await this.tripsService.findOne(id);
    return { success: true, data };
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(SystemRole.OPERATOR, SystemRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Nhà Xe] Lên lịch một chuyến xe mới' })
  async create(
    @Body() createDto: CreateTripDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const data = await this.tripsService.create(user.sub, createDto);
    return { success: true, data };
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(SystemRole.OPERATOR, SystemRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Nhà Xe] Cập nhật chuyến xe' })
  async update(
    @Param('id', MongoIdPipe) id: string,
    @Body() updateDto: UpdateTripDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const data = await this.tripsService.update(
      id,
      user.sub,
      user.role as string,
      updateDto,
    );
    return { success: true, data };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(SystemRole.OPERATOR, SystemRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Nhà Xe] Hủy/Xóa lịch trình chuyến' })
  async remove(
    @Param('id', MongoIdPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.tripsService.remove(id, user.sub, user.role as string);
    return { success: true, message: 'Đã hủy chuyến xe thành công' };
  }
}
