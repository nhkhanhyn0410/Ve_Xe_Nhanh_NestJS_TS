import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateBankInfoDto {
  @ApiProperty({ example: 'Vietcombank' })
  @IsNotEmpty()
  @IsString()
  bankName: string;

  @ApiProperty({ example: '0071000123456' })
  @IsNotEmpty()
  @IsString()
  accountNumber: string;

  @ApiProperty({ example: 'CONG TY TNHH PHUONG TRANG' })
  @IsNotEmpty()
  @IsString()
  accountHolder: string;

  @ApiProperty({ example: 'Chi nhanh Go Vap' })
  @IsNotEmpty()
  @IsString()
  branch: string;
}
