import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateOperatorDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  companyName: string;

  @ApiProperty({ example: 'contact@futabus.vn' })
  // @IsNotEmpty()
  @IsEmail()
  @IsOptional()
  email: string;

  @ApiProperty({ example: '0283 8386 852' })
  @IsNotEmpty()
  @IsString()
  @Matches(/^(\+84|0)\d{9,10}$/)
  @IsOptional()
  phone: string;

  @ApiProperty({ minLength: 6 })
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'GP-KD-0001234' })
  @IsNotEmpty()
  @IsString()
  businessLicense: string;

  @ApiProperty({ example: '0300123456' })
  @IsNotEmpty()
  @IsString()
  taxCode: string;

  @ApiProperty({ example: '01 Phan Van Tri, P.7, Q. Go Vap, TP.HCM' })
  @IsNotEmpty()
  @IsString()
  address: string;

  @ApiPropertyOptional({ example: 'Nha xe hang dau Viet Nam...' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/logo.png' })
  @IsOptional()
  @IsString()
  logo?: string;
}
