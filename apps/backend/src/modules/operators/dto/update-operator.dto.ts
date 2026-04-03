import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateOperatorDto } from './create-operator.dto';

// PartialType = tat ca field thanh optional
// OmitType = bo cac field khong cho phep cap nhat
export class UpdateOperatorDto extends PartialType(
  OmitType(CreateOperatorDto, ['email', 'password'] as const),
) {}
