import { api } from './api';

export interface DiscountCalculation {
  contractedPrice: number;
  discountPercentage: number;
  discountAmount: number;
  finalPrice: number;
}

export const discountsService = {
  async calculate(
    contractedPrice: number,
    discountPercentage: number
  ): Promise<DiscountCalculation> {
    const response = await api.post<DiscountCalculation>('/discounts/calculate', {
      contractedPrice,
      discountPercentage,
    });
    return response.data;
  },

  // Cálculo local síncrono para respostas instantâneas na interface enquanto digita
  calculateLocal(
    contractedPrice: number,
    discountPercentage: number
  ): DiscountCalculation {
    const base = Number(contractedPrice) || 0;
    const pct = Math.max(0, Math.min(100, Number(discountPercentage) || 0));
    const discountAmount = Math.round((base * (pct / 100)) * 100) / 100;
    const finalPrice = Math.round((base - discountAmount) * 100) / 100;
    return {
      contractedPrice: Math.round(base * 100) / 100,
      discountPercentage: pct,
      discountAmount,
      finalPrice,
    };
  },
};
