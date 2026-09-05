import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateModalityDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  monthlyPrice!: number;

  @IsBoolean()
  @IsOptional()
  requiresClass?: boolean;

  @IsNumber()
  @Min(1)
  @IsOptional()
  capacity?: number;
}