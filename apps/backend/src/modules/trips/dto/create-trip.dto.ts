import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  Min,
  Max,
  IsDateString,
  ValidateNested,
  IsBoolean,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class DynamicPricingDto {
  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  demandMultiplierEnabled?: boolean;

  @ApiProperty({ required: false })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  highDemandThreshold?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @Min(1)
  @Max(3)
  @IsOptional()
  highDemandMultiplier?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  veryHighDemandThreshold?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @Min(1)
  @Max(3)
  @IsOptional()
  veryHighDemandMultiplier?: number;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  earlyBirdEnabled?: boolean;

  @ApiProperty({ required: false })
  @IsNumber()
  @Min(1)
  @IsOptional()
  daysBeforeDeparture?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @Min(0)
  @Max(50)
  @IsOptional()
  discountPercentage?: number;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  peakHoursEnabled?: boolean;

  @ApiProperty({ required: false, type: [Number] })
  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  peakHours?: number[];

  @ApiProperty({ required: false })
  @IsNumber()
  @Min(0)
  @Max(50)
  @IsOptional()
  peakHoursPremiumPercentage?: number;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  weekendPremiumEnabled?: boolean;

  @ApiProperty({ required: false })
  @IsNumber()
  @Min(0)
  @Max(50)
  @IsOptional()
  weekendPremiumPercentage?: number;
}

export class CreateTripDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  routeId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  busId: string;

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
  basePrice: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  discount?: number;

  @ApiProperty({ required: false })
  @ValidateNested()
  @Type(() => DynamicPricingDto)
  @IsOptional()
  dynamicPricing?: DynamicPricingDto;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  driverId?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  tripManagerId?: string;
}
