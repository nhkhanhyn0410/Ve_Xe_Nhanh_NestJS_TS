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
import { StopPointsService, StopPointQuery } from './stop-points.service';
import { CreateStopPointDto } from './dto/create-stop-point.dto';
import { UpdateStopPointDto } from './dto/update-stop-point.dto';
import { MongoIdPipe } from '../../common/pipes/mongo-id.pipe';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { StopPointType, SystemRole } from '@ve_xe_nhanh_ts/shared-types';

@ApiTags('Stop Points')
@Controller('stop-points')
export class StopPointsController {
  constructor(private readonly stopPointsService: StopPointsService) {}

  // ===== PUBLIC ENDPOINTS =====
  @Get()
  @ApiOperation({ summary: 'Lấy danh sách điểm dừng toàn quốc' })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiQuery({ name: 'city', required: false, type: String })
  @ApiQuery({ name: 'type', required: false, enum: StopPointType })
  @ApiQuery({ name: 'search', required: false, type: String })
  async findAll(@Query() query: StopPointQuery) {
    const data = await this.stopPointsService.findAll(query);
    return { success: true, data };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Xem chi tiết một điểm dừng' })
  async findOne(@Param('id', MongoIdPipe) id: string) {
    const data = await this.stopPointsService.findOne(id);
    return { success: true, data };
  }

  // ===== ADMIN ENDPOINTS =====
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(SystemRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Thêm điểm dừng mới' })
  async create(@Body() createDto: CreateStopPointDto) {
    const data = await this.stopPointsService.create(createDto);
    return { success: true, data };
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(SystemRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Cập nhật điểm dừng' })
  async update(
    @Param('id', MongoIdPipe) id: string,
    @Body() updateDto: UpdateStopPointDto,
  ) {
    const data = await this.stopPointsService.update(id, updateDto);
    return { success: true, data };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(SystemRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Xóa điểm dừng' })
  async remove(@Param('id', MongoIdPipe) id: string) {
    await this.stopPointsService.remove(id);
    return { success: true, message: 'Đã xóa điểm dừng' };
  }
}
