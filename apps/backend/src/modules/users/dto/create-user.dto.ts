import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsDate,
  MinLength,
  Matches,
  IsEnum,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Gender } from '@ve_xe_nhanh_ts/shared-types';

export class CreateUserDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  fullName: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsEnum(Gender)
  gender: Gender;

  @ApiProperty()
  @IsNotEmpty()
  @IsDate()
  dateOfBirth: Date;

  @ApiProperty()
  @IsEmail({}, { message: 'Email không hợp lệ' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  email: string;

  @ApiProperty()
  @Matches(/^(0|\+84)\d{9}$/, { message: 'Số điện thoại không hợp lệ' })
  @IsNotEmpty({ message: 'Số điện thoại không được để trống' })
  phone: string;

  @ApiProperty({ minLength: 6 })
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}
