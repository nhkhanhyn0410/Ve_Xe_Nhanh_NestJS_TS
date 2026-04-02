import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { ConfigService } from '@nestjs/config';
import { RegisterDto } from './dto/register.dto';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcryptjs';
import { UserDocument } from '../users/schemas/user.schema';
// import { RefreshTokenDto } from './dto/refresh-token.dto';

@Injectable()
export class AuthService {
  private readonly logger: Logger;
  constructor(
    private usersService: UsersService,
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

      const user = await this.usersService.findByIdWithRefreshToken(
        payload.sub,
      );
      if (!user || !user.refreshToken) {
        throw new UnauthorizedException('Refresh token không hợp lệ');
      }
    } catch {
      throw new UnauthorizedException(
        'Refresh token không hợp lệ hoặc đã hết hạn',
      );
    }
  }

  async logout(userId: string) {
    await this.usersService.updateRefreshToken(userId, null);
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
