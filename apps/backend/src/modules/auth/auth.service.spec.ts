import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { OperatorsService } from '../operators/operators.service';
import { AdminService } from '../admin/admin.service';
import { Gender } from '@ve_xe_nhanh_ts/shared-types';

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: Partial<Record<keyof UsersService, jest.Mock>>;
  let operatorsService: Partial<Record<keyof OperatorsService, jest.Mock>>;
  let adminService: Partial<Record<keyof AdminService, jest.Mock>>;

  beforeEach(async () => {
    usersService = {
      create: jest.fn(),
      findByEmail: jest.fn(),
      findByIdWithRefreshToken: jest.fn(),
      updateRefreshToken: jest.fn(),
      updateLastLogin: jest.fn(),
    };

    operatorsService = {
      findByUsername: jest.fn(),
      findByIdWithRefreshToken: jest.fn(),
      updateRefreshToken: jest.fn(),
      updateLastLogin: jest.fn(),
    };

    adminService = {
      findByUsername: jest.fn(),
      findByIdWithRefreshToken: jest.fn(),
      updateRefreshToken: jest.fn(),
      updateLastLogin: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: OperatorsService, useValue: operatorsService },
        { provide: AdminService, useValue: adminService },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn().mockResolvedValue('mock-token'),
            verify: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('test-secret'),
          },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
  });

  describe('register', () => {
    it('should register a new user and return tokens', async () => {
      const mockUser = {
        _id: { toString: () => 'user-id-123' },
        email: 'test@test.com',
        toJSON: () => ({
          id: 'user-id-123',
          email: 'test@test.com',
          fullName: 'Test',
        }),
      };
      usersService.create!.mockResolvedValue(mockUser);
      usersService.updateRefreshToken!.mockResolvedValue(undefined);

      const result = await authService.register({
        fullName: 'Test',
        email: 'test@test.com',
        dateOfBirth: new Date('2000-10-02'),
        gender: Gender.MALE,
        phone: '0123456789',
        password: '123456',
      });

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(usersService.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('login', () => {
    it('should throw UnauthorizedException for wrong email', async () => {
      usersService.findByEmail!.mockResolvedValue(null);

      await expect(
        authService.login({ identifier: 'wrong@test.com', password: '123456' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for blocked user', async () => {
      usersService.findByEmail!.mockResolvedValue({
        isBlocked: true,
        password: 'hashed',
      });

      await expect(
        authService.login({ identifier: 'test@test.com', password: '123456' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
