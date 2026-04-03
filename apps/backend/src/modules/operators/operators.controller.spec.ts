import { Test, TestingModule } from '@nestjs/testing';
import { OperatorStatus, SystemRole } from '@ve_xe_nhanh_ts/shared-types';
import { OperatorsController } from './operators.controller';
import { OperatorsService } from './operators.service';
import { CreateOperatorDto } from './dto/create-operator.dto';
import { UpdateOperatorDto } from './dto/update-operator.dto';
import { UpdateBankInfoDto } from './dto/update-bank-info.dto';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';

describe('OperatorsController', () => {
  let controller: OperatorsController;

  const mockOperatorsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    approve: jest.fn(),
    reject: jest.fn(),
    suspend: jest.fn(),
    resume: jest.fn(),
    updateBankInfo: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OperatorsController],
      providers: [
        {
          provide: OperatorsService,
          useValue: mockOperatorsService,
        },
      ],
    }).compile();

    controller = module.get<OperatorsController>(OperatorsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should create a new operator', async () => {
      const dto: CreateOperatorDto = {
        companyName: 'Test Company',
        email: 'test@example.com',
        phone: '0123456789',
        password: 'password123',
        address: '123 Street',
        businessLicense: 'GP-123',
        taxCode: 'TAX-123',
      };
      const expectedResult = { _id: 'mock-id', ...dto };
      mockOperatorsService.create.mockResolvedValue(expectedResult);

      const result = await controller.register(dto);

      expect(mockOperatorsService.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual({
        success: true,
        data: expectedResult,
        message: 'Dang ky thanh cong. Vui long cho admin duyet.',
      });
    });
  });

  describe('findAll', () => {
    it('should return a list of operators', async () => {
      const expectedResult = {
        data: [],
        meta: { page: 1, limit: 10, total: 0, totalPages: 0 },
      };
      mockOperatorsService.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll(1, 10);

      expect(mockOperatorsService.findAll).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        status: undefined,
        search: undefined,
      });
      expect(result).toEqual({ success: true, ...expectedResult });
    });
  });

  describe('findOne', () => {
    it('should return a single operator', async () => {
      const id = 'mock-mongo-id';
      const expectedResult = { _id: id, companyName: 'Test' };
      mockOperatorsService.findById.mockResolvedValue(expectedResult);

      const result = await controller.findOne(id);

      expect(mockOperatorsService.findById).toHaveBeenCalledWith(id);
      expect(result).toEqual({ success: true, data: expectedResult });
    });
  });

  describe('update', () => {
    it('should update an operator', async () => {
      const id = 'mock-id';
      const dto: UpdateOperatorDto = { companyName: 'Updated Name' };
      const expectedResult = { _id: id, ...dto };
      mockOperatorsService.update.mockResolvedValue(expectedResult);

      const result = await controller.update(id, dto);

      expect(mockOperatorsService.update).toHaveBeenCalledWith(id, dto);
      expect(result).toEqual({ success: true, data: expectedResult });
    });
  });

  describe('remove', () => {
    it('should delete an operator', async () => {
      const id = 'mock-id';
      mockOperatorsService.remove.mockResolvedValue(undefined);

      const result = await controller.remove(id);

      expect(mockOperatorsService.remove).toHaveBeenCalledWith(id);
      expect(result).toEqual({
        success: true,
        message: 'Xoa nha xe thanh cong',
      });
    });
  });

  describe('admin operations', () => {
    const id = 'mock-id';
    const admin: JwtPayload = {
      sub: 'admin-id',
      email: 'admin@test.com',
      role: SystemRole.ADMIN,
    };

    it('should approve an operator', async () => {
      const expectedResult = { _id: id, status: OperatorStatus.APPROVED };
      mockOperatorsService.approve.mockResolvedValue(expectedResult);

      const result = await controller.approve(id, admin);

      expect(mockOperatorsService.approve).toHaveBeenCalledWith(id, admin.sub);
      expect(result).toEqual({ success: true, data: expectedResult });
    });

    it('should reject an operator', async () => {
      const reason = 'Invalid documents';
      const expectedResult = { _id: id, status: OperatorStatus.REJECTED };
      mockOperatorsService.reject.mockResolvedValue(expectedResult);

      const result = await controller.reject(id, reason);

      expect(mockOperatorsService.reject).toHaveBeenCalledWith(id, reason);
      expect(result).toEqual({ success: true, data: expectedResult });
    });
  });

  describe('updateBankInfo', () => {
    it('should update bank info', async () => {
      const id = 'mock-id';
      const dto: UpdateBankInfoDto = {
        bankName: 'Test Bank',
        accountNumber: '123456',
        accountHolder: 'Test User',
        branch: 'Test Branch',
      };
      const expectedResult = { _id: id, bankInfo: dto };
      mockOperatorsService.updateBankInfo.mockResolvedValue(expectedResult);

      const result = await controller.updateBankInfo(id, dto);

      expect(mockOperatorsService.updateBankInfo).toHaveBeenCalledWith(id, dto);
      expect(result).toEqual({ success: true, data: expectedResult });
    });
  });
});
