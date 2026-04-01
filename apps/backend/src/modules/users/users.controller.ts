import { Controller, Get, Put, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
// import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  // constructor(private readonly usersService: UsersService) {}
  @Get('me')
  @ApiOperation({ summary: 'GET hồ sơ người dùng hiện tại' })
  // @UseGuards(JwtAuthGuard)  // Se them sau khi co Auth module
  // @ApiBearerAuth()
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getMe(@CurrentUser() _user: JwtPayload) {
    // Tam thoi tra ve placeholder, se ket noi voi auth sau
    return { message: 'Profile endpoint ready' };
  }

  @Put('me')
  @ApiOperation({ summary: 'UPDATE hồ sơ người dùng hiện tại' })
  updateMe(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    @CurrentUser() _user: JwtPayload,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    @Body() _updateUserDto: UpdateUserDto,
  ) {
    return { message: 'Update endpoint ready' };
  }
}
