import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class UpdateClassScheduleDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek?: number;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  startTime?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  endTime?: string;

  @IsOptional()
  @IsString()
  room?: string;
}