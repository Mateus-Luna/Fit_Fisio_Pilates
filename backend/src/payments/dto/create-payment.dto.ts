import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { PaymentPeriod } from 'generated/prisma/enums';

export class CreatePaymentDto {
  @IsString()
  studentId!: string;

  @IsOptional()
  @IsString()
  enrollmentId?: string;

  @IsInt()
  @Min(1)
  @Max(12)
  referenceMonth!: number;

  @IsInt()
  referenceYear!: number;

  @IsOptional()
  @IsEnum(PaymentPeriod)
  period?: PaymentPeriod;

  @IsDateString()
  dueDate!: string;

  @IsOptional()
  @IsString()
  observation?: string;
}