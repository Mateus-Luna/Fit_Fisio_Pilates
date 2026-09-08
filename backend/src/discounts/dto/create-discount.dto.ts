import {
  IsNumber,
  Max,
  Min,
} from 'class-validator';

export class CreateDiscountDto {
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  contractedPrice!: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  discountPercentage!: number;
}