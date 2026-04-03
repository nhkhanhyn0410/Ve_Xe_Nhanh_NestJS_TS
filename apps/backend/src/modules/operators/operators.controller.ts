import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { OperatorStatus, SystemRole } from '@ve_xe_nhanh_ts/shared-types';
import { OperatorsService } from './operators.service';
import { CreateOperatorDto } from './dto/create-operator.dto';
import { UpdateOperatorDto } from './dto/update-operator.dto';
import { UpdateBankInfoDto } from './dto/update-bank-info.dto';
import { MongoIdPipe } from '@common/pipes/mongo-id.pipe';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';

@ApiTags('Operators')
@Controller('operators')
export class OperatorsController {
  constructor(private readonly operatorsService: OperatorsService) {}

  // ===== PUBLIC ENDPOINTS =====

  @Post('register')
  @ApiOperation({ summary: 'Dang ky nha xe moi' })
  async register(@Body() createOperatorDto: CreateOperatorDto) {
    const operator = await this.operatorsService.create(createOperatorDto);
    return {
      success: true,
      data: operator,
      message: 'Dang ky thanh cong. Vui long cho admin duyet.',
    };
  }

  // ===== OPERATOR ENDPOINTS (can auth sau nay) =====

  @Get()
  @ApiOperation({ summary: 'Danh sach nha xe' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: OperatorStatus })
  @ApiQuery({ name: 'search', required: false, type: String })
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('status') status?: OperatorStatus,
    @Query('search') search?: string,
  ) {
    const result = await this.operatorsService.findAll({
      page,
      limit,
      status,
      search,
    });
    return { success: true, ...result };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiet nha xe' })
  async findOne(@Param('id', MongoIdPipe) id: string) {
    const operator = await this.operatorsService.findById(id);
    return { success: true, data: operator };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Cap nhat thong tin nha xe' })
  async update(
    @Param('id', MongoIdPipe) id: string,
    @Body() dto: UpdateOperatorDto,
  ) {
    const operator = await this.operatorsService.update(id, dto);
    return { success: true, data: operator };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xoa nha xe' })
  async remove(@Param('id', MongoIdPipe) id: string) {
    await this.operatorsService.remove(id);
    return { success: true, message: 'Xoa nha xe thanh cong' };
  }

  // ===== ADMIN ENDPOINTS (Da khao bao bao mat) =====

  @Post(':id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(SystemRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Duyet nha xe' })
  async approve(
    @Param('id', MongoIdPipe) id: string,
    @CurrentUser() admin: JwtPayload,
  ) {
    const operator = await this.operatorsService.approve(id, admin.sub);
    return { success: true, data: operator };
  }

  @Post(':id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(SystemRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Tu choi nha xe' })
  async reject(
    @Param('id', MongoIdPipe) id: string,
    @Body('reason') reason: string,
  ) {
    const operator = await this.operatorsService.reject(id, reason);
    return { success: true, data: operator };
  }

  @Post(':id/suspend')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(SystemRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Tam ngung nha xe' })
  async suspend(
    @Param('id', MongoIdPipe) id: string,
    @Body('reason') reason: string,
  ) {
    const operator = await this.operatorsService.suspend(id, reason);
    return { success: true, data: operator };
  }

  @Post(':id/resume')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(SystemRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Mo lai nha xe' })
  async resume(@Param('id', MongoIdPipe) id: string) {
    const operator = await this.operatorsService.resume(id);
    return { success: true, data: operator };
  }

  // ===== BANK INFO =====

  @Put(':id/bank-info')
  @ApiOperation({ summary: 'Cap nhat thong tin ngan hang' })
  async updateBankInfo(
    @Param('id', MongoIdPipe) id: string,
    @Body() dto: UpdateBankInfoDto,
  ) {
    const operator = await this.operatorsService.updateBankInfo(id, dto);
    return { success: true, data: operator };
  }
}
