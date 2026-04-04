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
import { BusesService } from './buses.service';
import { CreateBusDto } from './dto/create-bus.dto';
import { UpdateBusDto } from './dto/update-bus.dto';
import { MongoIdPipe } from '@common/pipes/mongo-id.pipe';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { SystemRole, BusType, BusStatus } from '@ve_xe_nhanh_ts/shared-types';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { JwtPayload } from '@common/interfaces/jwt-payload.interface';

@ApiTags('Buses')
@Controller('buses')
export class BusesController {
  constructor(private readonly busesService: BusesService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách xe' })
  @ApiQuery({ name: 'operatorId', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: BusStatus })
  @ApiQuery({ name: 'busType', required: false, enum: BusType })
  @ApiQuery({ name: 'busNumber', required: false, type: String })
  async findAll(@Query() query: any) {
    const data = await this.busesService.findAll(query);
    return { success: true, data };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Xem chi tiết một con xe' })
  async findOne(@Param('id', MongoIdPipe) id: string) {
    const data = await this.busesService.findOne(id);
    return { success: true, data };
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(SystemRole.OPERATOR, SystemRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Nhà Xe] Thêm mới một chiếc xe' })
  async create(
    @Body() createDto: CreateBusDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const data = await this.busesService.create(user.sub, createDto);
    return { success: true, data };
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(SystemRole.OPERATOR, SystemRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Nhà Xe] Cập nhật thông tin/sơ đồ ghế của xe' })
  async update(
    @Param('id', MongoIdPipe) id: string,
    @Body() updateDto: UpdateBusDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const data = await this.busesService.update(
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
  @ApiOperation({ summary: '[Nhà Xe] Xóa / Hủy xe' })
  async remove(
    @Param('id', MongoIdPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.busesService.remove(id, user.sub, user.role as string);
    return { success: true, message: 'Đã xóa xe thành công' };
  }
}
