import {
  IsString,
  IsNotEmpty,
  IsOptional,
  ValidateNested,
  IsNumber,
  Min,
  Max,
  Matches,
  IsArray,
  IsEnum,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { BusType, BusStatus, BusAmenity } from '@ve_xe_nhanh_ts/shared-types';

export class RegistrationInfoDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  certificateNumber?: string;

  @ApiProperty({ required: false })
  @IsNumber()
  @Min(1)
  @IsOptional()
  payloadCapacity?: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  expirationDate?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  insuranceExpirationDate?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  ownerName?: string;
}

export class SeatLayoutDto {
  @ApiProperty()
  @IsNumber()
  @Min(1)
  @Max(2)
  floors: number;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  @Max(20)
  rows: number;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  @Max(10)
  columns: number;

  @ApiProperty({
    description: 'Mảng 2 chiều chứa cấu hình ghế',
    example: [
      ['A1', 'AISLE', 'B1'],
      ['A2', 'AISLE', 'B2'],
    ],
  })
  @IsArray()
  @ArrayMinSize(1)
  layout: string[][];

  // Custom validator for 2D array could be added here
}

export class CreateBusDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Z0-9-]+$/, {
    message: 'Biển số xe chỉ được chứa chữ hoa, số và dấu gạch ngang',
  })
  busNumber: string;

  @ApiProperty({ enum: BusType })
  @IsEnum(BusType)
  busType: BusType;

  @ApiProperty()
  @ValidateNested()
  @Type(() => SeatLayoutDto)
  seatLayout: SeatLayoutDto;

  @ApiProperty({ enum: BusAmenity, isArray: true })
  @IsArray()
  @IsEnum(BusAmenity, { each: true })
  amenities: BusAmenity[];

  @ApiProperty({ enum: BusStatus, required: false })
  @IsEnum(BusStatus)
  @IsOptional()
  status?: BusStatus;

  // Optionals
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ required: false, type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];

  @ApiProperty({ required: false, type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  actualImages?: string[];

  @ApiProperty({ required: false })
  @ValidateNested()
  @Type(() => RegistrationInfoDto)
  @IsOptional()
  registrationInfo?: RegistrationInfoDto;
}
