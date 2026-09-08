import {
  Body,
  Controller,
  Post,
} from '@nestjs/common';

import { DiscountsService } from './discounts.service';
import {CreateDiscountDto} from './dto/create-discount.dto';
@Controller('discounts')
export class DiscountsController {
  constructor(
    private readonly discountsService: DiscountsService,
  ) {}

  @Post('calculate')
  calculate(
    @Body() createDiscountDto: CreateDiscountDto,
  ) {
    return this.discountsService.calculate(
      createDiscountDto.contractedPrice,
      createDiscountDto.discountPercentage,
    );
  }
}