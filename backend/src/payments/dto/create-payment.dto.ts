import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

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

  @IsDateString()
  dueDate!: string;

  @IsOptional()
  @IsString()
  observation?: string;
}