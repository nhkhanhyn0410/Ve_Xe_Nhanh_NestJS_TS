import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  ValidateNested,
  IsNumber,
  Min,
  Max,
  Matches,
  IsArray,
  IsMongoId,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { CoordinatesDto } from '../../stop-points/dto/create-stop-point.dto';

export class RoutePointDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsString()
  address: string;

  @ApiProperty()
  @ValidateNested()
  @Type(() => CoordinatesDto)
  coordinates: CoordinatesDto;
}

export class RouteStopDto extends RoutePointDto {
  @ApiProperty()
  @IsNumber()
  @Min(1)
  order: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  estimatedArrivalMinutes: number;

  @ApiProperty()
  @IsNumber()
  @Min(5)
  @Max(120)
  stopDuration: number;
}

export class CreateRouteDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  routeName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Z0-9-]+$/, {
    message: 'Mã tuyến chỉ được chứa chữ hoa, số và dấu gạch ngang',
  })
  routeCode: string;

  @ApiProperty()
  @IsMongoId()
  originId: string;

  @ApiProperty()
  @IsMongoId()
  destinationId: string;

  @ApiProperty({ type: [RoutePointDto], required: false })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RoutePointDto)
  @IsOptional()
  pickupPoints?: RoutePointDto[];

  @ApiProperty({ type: [RoutePointDto], required: false })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RoutePointDto)
  @IsOptional()
  dropoffPoints?: RoutePointDto[];

  @ApiProperty({ type: [RouteStopDto], required: false })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RouteStopDto)
  @IsOptional()
  stops?: RouteStopDto[];

  @ApiProperty()
  @IsNumber()
  @Min(0)
  distance: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  estimatedDuration: number;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
