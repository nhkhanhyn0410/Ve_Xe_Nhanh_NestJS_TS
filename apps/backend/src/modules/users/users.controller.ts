import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UpdateUserDto } from './dto/update-user.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'GET hồ sơ người dùng hiện tại' })
  async getMe(@CurrentUser() user: JwtPayload) {
    return this.usersService.findById(user.sub);
  }

  @Put('me')
  @ApiOperation({ summary: 'UPDATE hồ sơ người dùng hiện tại' })
  async updateMe(
    @CurrentUser() user: JwtPayload,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(user.sub, updateUserDto);
  }
}
