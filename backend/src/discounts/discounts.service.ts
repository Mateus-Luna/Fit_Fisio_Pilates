import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';

export interface DiscountCalculation {
  contractedPrice: number;
  discountPercentage: number;
  discountAmount: number;
  finalPrice: number;
}

@Injectable()
export class DiscountsService {
  calculate(
    contractedPrice: number,
    discountPercentage: number,
  ): DiscountCalculation {
    if (contractedPrice < 0) {
      throw new BadRequestException(
        'O valor contratado não pode ser negativo.',
      );
    }

    if (
      discountPercentage < 0 ||
      discountPercentage > 100
    ) {
      throw new BadRequestException(
        'O desconto deve estar entre 0% e 100%.',
      );
    }

    const discountAmount =
      contractedPrice * (discountPercentage / 100);

    const finalPrice =
      contractedPrice - discountAmount;

    return {
      contractedPrice: this.roundMoney(contractedPrice),
      discountPercentage: this.roundMoney(
        discountPercentage,
      ),
      discountAmount: this.roundMoney(discountAmount),
      finalPrice: this.roundMoney(finalPrice),
    };
  }

  private roundMoney(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }
}