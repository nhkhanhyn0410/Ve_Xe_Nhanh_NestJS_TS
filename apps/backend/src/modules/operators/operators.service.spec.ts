import { Test, TestingModule } from '@nestjs/testing';
import { OperatorsService } from './operators.service';
import { getModelToken } from '@nestjs/mongoose';
import { Operator } from './schemas/operator.schema';

describe('OperatorsService', () => {
  let operatorsService: OperatorsService;

  const mockOperatorModel = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OperatorsService,
        {
          provide: getModelToken(Operator.name),
          useValue: mockOperatorModel,
        },
      ],
    }).compile();

    operatorsService = module.get<OperatorsService>(OperatorsService);
  });

  it('should be defined', () => {
    expect(operatorsService).toBeDefined();
  });
});
