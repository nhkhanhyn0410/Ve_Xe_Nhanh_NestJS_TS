import { PickType } from '@nestjs/swagger';
import { CreateUserDto } from '../../users/dto/create-user.dto';

export class RegisterDto extends PickType(CreateUserDto, [
  'fullName',
  'gender',
  'dateOfBirth',
  'email',
  'phone',
  'password',
] as const) {}
