import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

import {
  DiscountCategory,
  DiscountType,
} from 'generated/prisma/enums';

export class CreateDiscountDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @IsEnum(DiscountCategory)
  category!: DiscountCategory;

  @IsEnum(DiscountType)
  type!: DiscountType;

  @IsOptional()
  @IsInt()
  @Min(2)
  minimumQuantity?: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  value!: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}