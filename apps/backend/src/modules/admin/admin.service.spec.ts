import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { AdminService } from './admin.service';
import { Admin } from './schemas/admin.schema';

describe('AdminService', () => {
  let adminService: AdminService;

  const mockAdminModel = {
    findOne: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        {
          provide: getModelToken(Admin.name),
          useValue: mockAdminModel,
        },
      ],
    }).compile();

    adminService = module.get<AdminService>(AdminService);
  });

  it('should be defined', () => {
    expect(adminService).toBeDefined();
  });
});
