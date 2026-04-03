import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Route, RouteDocument } from './schemas/route.schema';
import { CreateRouteDto } from './dto/create-route.dto';
import { UpdateRouteDto } from './dto/update-route.dto';
import { SystemRole } from '@ve_xe_nhanh_ts/shared-types';

export interface RouteQuery {
  originId?: string;
  destinationId?: string;
  operatorId?: string;
  isActive?: string | boolean;
}

@Injectable()
export class RoutesService {
  constructor(
    @InjectModel(Route.name) private routeModel: Model<RouteDocument>,
  ) {}

  async create(operatorId: string, createDto: CreateRouteDto): Promise<Route> {
    const existingCode = await this.routeModel.findOne({
      routeCode: createDto.routeCode,
    });
    if (existingCode) {
      throw new ConflictException('Mã tuyến đường này đã tồn tại');
    }

    return this.routeModel.create({
      ...createDto,
      operatorId: new Types.ObjectId(operatorId),
    });
  }

  async findAll(query: RouteQuery = {}): Promise<RouteDocument[]> {
    const filter: Record<string, unknown> = {};
    if (query.originId) filter.originId = new Types.ObjectId(query.originId);
    if (query.destinationId)
      filter.destinationId = new Types.ObjectId(query.destinationId);
    if (query.operatorId)
      filter.operatorId = new Types.ObjectId(query.operatorId);
    if (query.isActive !== undefined && query.isActive !== '') {
      filter.isActive = query.isActive === 'true' || query.isActive === true;
    }

    const queryFilter = filter as unknown as Parameters<
      Model<RouteDocument>['find']
    >[0];

    return this.routeModel
      .find(queryFilter)
      .populate('originId', 'name city province')
      .populate('destinationId', 'name city province')
      .populate('operatorId', 'companyName')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(id: string): Promise<Route> {
    const route = await this.routeModel
      .findById(id)
      .populate('originId', 'name city province coordinates')
      .populate('destinationId', 'name city province coordinates')
      .exec();

    if (!route) {
      throw new NotFoundException('Không tìm thấy tuyến đường');
    }
    return route;
  }

  async update(
    id: string,
    operatorId: string,
    role: SystemRole,
    updateDto: UpdateRouteDto,
  ): Promise<Route> {
    const route = await this.findOne(id);

    // Kiểm tra quyền
    if (
      role !== SystemRole.ADMIN &&
      route.operatorId.toString() !== operatorId
    ) {
      throw new ForbiddenException(
        'Bạn không có quyền sửa tuyến đường của nhà xe khác',
      );
    }

    // Check unique routeCode nếu có đổi
    if (updateDto.routeCode && updateDto.routeCode !== route.routeCode) {
      const existingCode = await this.routeModel.findOne({
        routeCode: updateDto.routeCode,
      });
      if (existingCode) {
        throw new ConflictException('Mã tuyến đường mới này đã tồn tại');
      }
    }

    return this.routeModel
      .findByIdAndUpdate(id, updateDto, { new: true })
      .exec() as unknown as Route;
  }

  async remove(
    id: string,
    operatorId: string,
    role: SystemRole,
  ): Promise<void> {
    const route = await this.findOne(id);

    if (
      role !== SystemRole.ADMIN &&
      route.operatorId.toString() !== operatorId
    ) {
      throw new ForbiddenException(
        'Bạn không có quyền xóa tuyến đường của nhà xe khác',
      );
    }

    await this.routeModel.findByIdAndDelete(id).exec();
  }
}
