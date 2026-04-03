import {
  Injectable,
  NotFoundException,
  // ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { OperatorStatus } from '@ve_xe_nhanh_ts/shared-types';
import { Operator, OperatorDocument } from './schemas/operator.schema';
import { CreateOperatorDto } from './dto/create-operator.dto';
import { UpdateOperatorDto } from './dto/update-operator.dto';
import { UpdateBankInfoDto } from './dto/update-bank-info.dto';

@Injectable()
export class OperatorsService {
  constructor(
    @InjectModel(Operator.name)
    private operatorModel: Model<OperatorDocument>,
  ) {}

  // ===== CRUD CO BAN =====

  /**
   * Dang ky nha xe moi
   * - Check email trung
   * - Hash password
   * - Status mac dinh = PENDING (cho admin duyet)
   */
  async create(CreateOperatorDto: CreateOperatorDto): Promise<Operator> {
    // Check email da ton tai
    // const existing = await this.operatorModel.findOne({
    //   email: CreateOperatorDto.email,
    // });
    // if (existing) {
    //   throw new ConflictException('Email da duoc su dung');
    // }

    // Hash password
    const hashedPassword = await bcrypt.hash(CreateOperatorDto.password, 10);

    return this.operatorModel.create({
      ...CreateOperatorDto,
      password: hashedPassword,
      status: OperatorStatus.PENDING,
    });
  }

  /**
   * Lay danh sach nha xe (co pagination + filter)
   */
  async findAll(query: {
    page?: number;
    limit?: number;
    status?: OperatorStatus;
    search?: string;
  }) {
    const { page = 1, limit = 20, status, search } = query;
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    if (search) filter.$text = { $search: search };

    const [data, total] = await Promise.all([
      this.operatorModel
        .find(filter)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      this.operatorModel.countDocuments(filter),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Lay thong tin 1 nha xe theo ID
   */
  async findById(id: string): Promise<Operator> {
    const operator = await this.operatorModel.findById(id);
    if (!operator) {
      throw new NotFoundException('Nha xe khong ton tai');
    }
    return operator;
  }

  /**
   * Tim nha xe theo email
   */
  async findByEmail(email: string): Promise<OperatorDocument | null> {
    return this.operatorModel.findOne({ email }).select('+password').exec();
  }

  async findByUsername(username: string): Promise<OperatorDocument | null> {
    return this.operatorModel.findOne({ username }).select('+password').exec();
  }

  async findByIdWithRefreshToken(id: string): Promise<OperatorDocument | null> {
    return this.operatorModel.findById(id).select('+refreshToken').exec();
  }

  async updateRefreshToken(
    id: string,
    refreshToken: string | null,
  ): Promise<void> {
    const hashedToken = refreshToken
      ? await bcrypt.hash(refreshToken, 12)
      : null;
    await this.operatorModel.findByIdAndUpdate(id, {
      refreshToken: hashedToken,
    });
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.operatorModel.findByIdAndUpdate(id, { lastLoginAt: new Date() });
  }

  /**
   * Cap nhat thong tin nha xe
   */
  async update(id: string, dto: UpdateOperatorDto): Promise<Operator> {
    const operator = await this.operatorModel.findByIdAndUpdate(id, dto, {
      new: true,
    });
    if (!operator) {
      throw new NotFoundException('Nha xe khong ton tai');
    }
    return operator;
  }

  /**
   * Xoa nha xe (chi cho phep khi status = PENDING hoac REJECTED)
   */
  async remove(id: string): Promise<void> {
    const operator = await this.operatorModel.findById(id);
    if (!operator) {
      throw new NotFoundException('Nha xe khong ton tai');
    }
    if (operator.status === OperatorStatus.APPROVED) {
      throw new BadRequestException(
        'Khong the xoa nha xe da duoc duyet. Hay chuyen sang trang thai "Tam ngung" thay vi xoa.',
      );
    }
    await this.operatorModel.findByIdAndDelete(id);
  }

  // ===== DUYET NHA XE (Admin operations) =====

  /**
   * Duyet nha xe
   */
  async approve(id: string, approvedBy: string): Promise<Operator> {
    const operator = await this.operatorModel.findById(id);
    if (!operator) {
      throw new NotFoundException('Nha xe khong ton tai');
    }
    if (operator.status !== OperatorStatus.PENDING) {
      throw new BadRequestException(
        `Khong the duyet nha xe co trang thai "${operator.status}". Chi duyet khi trang thai la "pending".`,
      );
    }

    operator.status = OperatorStatus.APPROVED;
    operator.approvedAt = new Date();
    operator.approvedBy = approvedBy
      ? new Types.ObjectId(approvedBy)
      : undefined;
    return operator.save();
  }

  /**
   * Tu choi nha xe
   */
  async reject(id: string, reason: string): Promise<Operator> {
    const operator = await this.operatorModel.findById(id);
    if (!operator) {
      throw new NotFoundException('Nha xe khong ton tai');
    }
    if (operator.status !== OperatorStatus.PENDING) {
      throw new BadRequestException(
        `Khong the tu choi nha xe co trang thai "${operator.status}"`,
      );
    }

    operator.status = OperatorStatus.REJECTED;
    operator.rejectionReason = reason;
    return operator.save();
  }

  /**
   * Tam ngung nha xe
   */
  async suspend(id: string, reason: string): Promise<Operator> {
    const operator = await this.operatorModel.findById(id);
    if (!operator) {
      throw new NotFoundException('Nha xe khong ton tai');
    }
    if (operator.status !== OperatorStatus.APPROVED) {
      throw new BadRequestException(
        'Chi co the tam ngung nha xe da duoc duyet',
      );
    }

    operator.status = OperatorStatus.SUSPENDED;
    operator.suspensionReason = reason;
    return operator.save();
  }

  /**
   * Mo lai nha xe (resume tu suspended)
   */
  async resume(id: string): Promise<Operator> {
    const operator = await this.operatorModel.findById(id);
    if (!operator) {
      throw new NotFoundException('Nha xe khong ton tai');
    }
    if (operator.status !== OperatorStatus.SUSPENDED) {
      throw new BadRequestException(
        'Chi co the mo lai nha xe dang bi tam ngung',
      );
    }

    operator.status = OperatorStatus.APPROVED;
    operator.suspensionReason = undefined;
    return operator.save();
  }

  // ===== BANK INFO =====

  /**
   * Cap nhat thong tin ngan hang
   */
  async updateBankInfo(id: string, dto: UpdateBankInfoDto): Promise<Operator> {
    const operator = await this.operatorModel.findByIdAndUpdate(
      id,
      { bankInfo: dto },
      { new: true },
    );
    if (!operator) {
      throw new NotFoundException('Nha xe khong ton tai');
    }
    return operator;
  }
}
