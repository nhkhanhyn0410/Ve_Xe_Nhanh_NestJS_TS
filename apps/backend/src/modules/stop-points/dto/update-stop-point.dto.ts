import { PartialType } from '@nestjs/swagger';
import { CreateStopPointDto } from './create-stop-point.dto';

export class UpdateStopPointDto extends PartialType(CreateStopPointDto) {}
