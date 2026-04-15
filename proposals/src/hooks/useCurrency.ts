import { useMemo } from 'react';
import { Currency } from '../types';

interface CurrencyRates {
  USD: number;
  EUR: number;
  UAH: number;
}

/**
 * Hook для конвертації валют
 */
export function useCurrencyConverter(usdRate: number, eurRate: number) {
  const rates: CurrencyRates = useMemo(() => ({
    USD: usdRate,
    EUR: eurRate,
    UAH: 1,
  }), [usdRate, eurRate]);

  const convert = useMemo(() => {
    return (amount: number, from: Currency, to: Currency): number => {
      if (from === to) return amount;

      // Конвертуємо все через USD як базову валюту
      let amountInUSD = amount;

      if (from === 'UAH') {
        amountInUSD = amount / rates.USD;
      } else if (from === 'EUR') {
        amountInUSD = amount * rates.EUR / rates.USD;
      }

      // Конвертуємо з USD в цільову валюту
      if (to === 'UAH') {
        return amountInUSD * rates.USD;
      } else if (to === 'EUR') {
        return amountInUSD * rates.USD / rates.EUR;
      }

      return amountInUSD;
    };
  }, [rates]);

  return { convert, rates };
}

/**
 * Hook для розрахунків пропозиції
 */
export function useProposalCalculations(items: any[]) {
  return useMemo(() => {
    const costSubtotal = items.reduce((sum: number, item: any) =>
      sum + (item.costPrice * item.quantity), 0
    );
    const saleSubtotal = items.reduce((sum: number, item: any) =>
      sum + item.total, 0
    );
    const profit = saleSubtotal - costSubtotal;
    const profitPercent = costSubtotal > 0 ? (profit / costSubtotal) * 100 : 0;

    return { costSubtotal, saleSubtotal, profit, profitPercent };
  }, [items]);
}
