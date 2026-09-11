import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsUUID,
  IsString,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

import { CreateClassScheduleDto } from './create-class-schedule.dto';

export class CreateClassDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsUUID()
  modalityId!: string;

  @IsInt()
  @Min(1)
  capacity!: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateClassScheduleDto)
  schedules?: CreateClassScheduleDto[];
}