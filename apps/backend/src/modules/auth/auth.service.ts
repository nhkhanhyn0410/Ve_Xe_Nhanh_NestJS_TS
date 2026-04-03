import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { OperatorsService } from '../operators/operators.service';
import { AdminService } from '../admin/admin.service';
import { ConfigService } from '@nestjs/config';
import { RegisterDto } from './dto/register.dto';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcryptjs';
import { UserDocument } from '../users/schemas/user.schema';
import { SystemRole, OperatorStatus } from '@ve_xe_nhanh_ts/shared-types';

@Injectable()
export class AuthService {
  private readonly logger: Logger;
  constructor(
    private usersService: UsersService,
    private operatorsService: OperatorsService,
    private adminService: AdminService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {
    const isDev = this.configService.get<string>('NODE_ENV') === 'development';
    this.logger = new Logger(isDev ? 'DEV' : 'PROD');
  }

  private toUserResponse(users: UserDocument) {
    return {
      id: users._id,
      fullName: users.fullName,
      email: users.email,
      phone: users.phone,
      isEmailVerified: users.isEmailVerified,
      isPhoneVerified: users.isPhoneVerified,
    };
  }

  async register(registerDto: RegisterDto) {
    const user = await this.usersService.create(registerDto);
    const userId = user._id.toString();
    this.logger.log('Đang tạo người dùng mới...');
    const tokens = await this.generateTokens({
      sub: userId,
      email: user.email,
      role: SystemRole.USER,
    });
    await Promise.all([
      this.usersService.updateRefreshToken(userId, tokens.refreshToken),
      this.usersService.updateLastLogin(userId),
    ]);
    return {
      user: this.toUserResponse(user.toJSON() as UserDocument),
      ...tokens,
    };
  }

  async login(loginDto: LoginDto) {
    const { identifier, password } = loginDto;

    const isEmail = identifier.includes('@');
    const user = isEmail
      ? await this.usersService.findByEmail(identifier)
      : await this.usersService.findByPhone(identifier);

    if (!user) {
      throw new UnauthorizedException('Thông tin đăng nhập không chính xác');
    }

    if (user.isBlocked) {
      throw new UnauthorizedException('Tài khoản đã bị tạm ngưng hoạt động');
    }

    if (this.usersService.isLocked(user)) {
      throw new UnauthorizedException(
        'Tài khoản tạm khóa do đăng nhập sai nhiều lần. Thử lại sau 5 phút',
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password || '');
    if (!isPasswordValid) {
      await this.usersService.incrementFailedLogin(user._id.toString());
      throw new UnauthorizedException('Thông tin đăng nhập không chính xác');
    }

    const tokens = await this.generateTokens({
      sub: user._id.toString(),
      email: user.email,
      role: SystemRole.USER,
    });

    await this.usersService.updateRefreshToken(
      user._id.toString(),
      tokens.refreshToken,
    );
    await this.usersService.updateLastLogin(user._id.toString());

    return {
      user: user.toJSON() as Record<string, any>,
      ...tokens,
    };
  }

  async refreshTokens(refreshToken: string) {
    try {
      const payload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      const role = payload.role;

      if (role === SystemRole.USER) {
        const user = await this.usersService.findByIdWithRefreshToken(
          payload.sub,
        );
        if (!user || user.refreshToken !== refreshToken) {
          throw new UnauthorizedException(
            'Refresh token người dùng không hợp lệ',
          );
        }
      } else if (role === SystemRole.OPERATOR) {
        const operator = await this.operatorsService.findByIdWithRefreshToken(
          payload.sub,
        );
        if (!operator || operator.refreshToken !== refreshToken) {
          throw new UnauthorizedException('Refresh token nhà xe không hợp lệ');
        }
      } else if (role === SystemRole.ADMIN) {
        const admin = await this.adminService.findByIdWithRefreshToken(
          payload.sub,
        );
        if (!admin || admin.refreshToken !== refreshToken) {
          throw new UnauthorizedException('Refresh token admin không hợp lệ');
        }
      } else {
        throw new Error('Token không hợp lệ');
      }

      const tokens = await this.generateTokens({
        sub: payload.sub,
        email: payload.email,
        role: payload.role,
      });

      if (role === SystemRole.USER) {
        await this.usersService.updateRefreshToken(
          payload.sub,
          tokens.refreshToken,
        );
      } else if (role === SystemRole.OPERATOR) {
        await this.operatorsService.updateRefreshToken(
          payload.sub,
          tokens.refreshToken,
        );
      } else if (role === SystemRole.ADMIN) {
        await this.adminService.updateRefreshToken(
          payload.sub,
          tokens.refreshToken,
        );
      }

      return tokens;
    } catch {
      throw new UnauthorizedException(
        'Refresh token không hợp lệ hoặc đã hết hạn',
      );
    }
  }

  async logout(userId: string, role?: SystemRole) {
    if (role === SystemRole.OPERATOR) {
      await this.operatorsService.updateRefreshToken(userId, null);
    } else if (role === SystemRole.ADMIN) {
      await this.adminService.updateRefreshToken(userId, null);
    } else {
      await this.usersService.updateRefreshToken(userId, null);
    }
  }

  async operatorLogin(loginDto: LoginDto) {
    const { identifier: username, password } = loginDto;
    const operator = await this.operatorsService.findByUsername(username);

    if (!operator) {
      throw new UnauthorizedException('Thông tin đăng nhập không chính xác');
    }

    if (operator.status !== OperatorStatus.APPROVED) {
      throw new UnauthorizedException(
        'Tài khoản nhà xe chưa được duyệt hoặc đang bị khóa',
      );
    }

    const isPasswordValid = await bcrypt.compare(password, operator.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Thông tin đăng nhập không chính xác');
    }

    const tokens = await this.generateTokens({
      sub: operator._id.toString(),
      email: operator.email,
      role: SystemRole.OPERATOR,
    });

    await this.operatorsService.updateRefreshToken(
      operator._id.toString(),
      tokens.refreshToken,
    );
    await this.operatorsService.updateLastLogin(operator._id.toString());

    return {
      operator: operator.toJSON() as Record<string, any>,
      ...tokens,
    };
  }

  async adminLogin(loginDto: LoginDto) {
    const { identifier: username, password } = loginDto;
    const admin = await this.adminService.findByUsername(username);

    if (!admin) {
      throw new UnauthorizedException('Thông tin đăng nhập không chính xác');
    }

    if (!admin.isActive) {
      throw new UnauthorizedException('Tài khoản admin đang bị khóa');
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      admin.password || '',
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Thông tin đăng nhập không chính xác');
    }

    const tokens = await this.generateTokens({
      sub: admin._id.toString(),
      email: admin.email,
      role: SystemRole.ADMIN,
    });

    await this.adminService.updateRefreshToken(
      admin._id.toString(),
      tokens.refreshToken,
    );
    await this.adminService.updateLastLogin(admin._id.toString());

    return {
      admin: admin.toJSON() as Record<string, any>,
      ...tokens,
    };
  }

  private async generateTokens(payload: JwtPayload) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_SECRET')!,
        expiresIn: Number(this.configService.get<string>('JWT_ACCESS_EXPIRES')),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_SECRET')!,
        expiresIn: Number(
          this.configService.get<string>('JWT_REFRESH_EXPIRES'),
        ),
      }),
    ]);

    return { accessToken, refreshToken };
  }
}
