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
import { RoutesService, RouteQuery } from './routes.service';
import { CreateRouteDto } from './dto/create-route.dto';
import { UpdateRouteDto } from './dto/update-route.dto';
import { MongoIdPipe } from '../../common/pipes/mongo-id.pipe';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { SystemRole } from '@ve_xe_nhanh_ts/shared-types';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';

@ApiTags('Routes')
@Controller('routes')
export class RoutesController {
  constructor(private readonly routesService: RoutesService) {}

  // ===== PUBLIC ENDPOINTS =====
  @Get()
  @ApiOperation({ summary: 'Tìm kiếm tất cả tuyến đường' })
  @ApiQuery({ name: 'originId', required: false, type: String })
  @ApiQuery({ name: 'destinationId', required: false, type: String })
  @ApiQuery({ name: 'operatorId', required: false, type: String })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  async findAll(@Query() query: RouteQuery) {
    const data = await this.routesService.findAll(query);
    return { success: true, data };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Xem chi tiết một tuyến đường' })
  async findOne(@Param('id', MongoIdPipe) id: string) {
    const data = await this.routesService.findOne(id);
    return { success: true, data };
  }

  // ===== SECURE ENDPOINTS (Operator / Admin) =====
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(SystemRole.OPERATOR, SystemRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Nhà Xe] Tạo tuyến đường mới' })
  async create(
    @Body() createDto: CreateRouteDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const operatorId = user.sub;
    const data = await this.routesService.create(operatorId, createDto);
    return { success: true, data };
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(SystemRole.OPERATOR, SystemRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Nhà Xe] Cập nhật tuyến đường' })
  async update(
    @Param('id', MongoIdPipe) id: string,
    @Body() updateDto: UpdateRouteDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const data = await this.routesService.update(
      id,
      user.sub,
      user.role,
      updateDto,
    );
    return { success: true, data };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(SystemRole.OPERATOR, SystemRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Nhà Xe/Admin] Xóa tuyến đường' })
  async remove(
    @Param('id', MongoIdPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.routesService.remove(id, user.sub, user.role);
    return { success: true, message: 'Đã xóa tuyến đường' };
  }
}
