import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateEnrollmentDto {
  @IsString()
  studentId!: string;

  @IsString()
  modalityId!: string;

  @IsDateString()
  startDate!: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  discountPercentage?: number;

  @IsOptional()
  @IsString()
  observation?: string;

  @IsOptional()
  @IsString()
  classId?: string;
}