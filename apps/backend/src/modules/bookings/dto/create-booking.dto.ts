import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  Min,
  IsDateString,
  IsEmail,
  ValidateNested,
  IsArray,
  IsBoolean,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { JourneyType } from '@ve_xe_nhanh_ts/shared-types';

export class PassengerInfoDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ required: false })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  identityCard?: string;
}

export class TransitInstructionDto {
  @ApiProperty()
  @IsBoolean()
  requiresTransit: boolean;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  coordinates?: { lat: number; lng: number };

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  transitNote?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  hubStopPointId?: string;
}

export class SegmentTicketDto {
  // Using SegmentTicket for payload validation
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  operatorId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  tripId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  seatNumber: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  pickupPointId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  dropoffPointId: string;

  @ApiProperty()
  @IsDateString()
  @IsNotEmpty()
  departureTime: string;

  @ApiProperty()
  @IsDateString()
  @IsNotEmpty()
  arrivalTime: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  price: number;
}

export class CreateBookingDto {
  @ApiProperty({ type: PassengerInfoDto })
  @ValidateNested()
  @Type(() => PassengerInfoDto)
  @IsNotEmpty()
  passengerInfo: PassengerInfoDto;

  @ApiProperty({ enum: JourneyType })
  @IsEnum(JourneyType)
  @IsNotEmpty()
  journeyType: JourneyType;

  @ApiProperty({ type: [SegmentTicketDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SegmentTicketDto)
  @IsNotEmpty()
  tickets: SegmentTicketDto[];

  @ApiProperty({ required: false, type: TransitInstructionDto })
  @ValidateNested()
  @Type(() => TransitInstructionDto)
  @IsOptional()
  transitInfo?: TransitInstructionDto;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  totalAmount: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}
