import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class UpdateEnrollmentDto {
  @IsOptional()
  @IsString()
  studentId?: string;

  @IsOptional()
  @IsString()
  modalityId?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

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