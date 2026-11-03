import { TAX_YEAR_2026 } from './data/2026';
import type { FilingStatus } from './types';

export function calculateFederalIncomeTax(
  taxableIncome: number,
  filingStatus: FilingStatus,
): number {
  const income = Math.max(0, taxableIncome);
  const brackets = TAX_YEAR_2026.ordinaryBrackets[filingStatus];
  let lowerBound = 0;
  let tax = 0;

  for (const bracket of brackets) {
    const amountInBracket = Math.max(0, Math.min(income, bracket.ceiling) - lowerBound);
    tax += amountInBracket * bracket.rate;
    lowerBound = bracket.ceiling;

    if (income <= bracket.ceiling) {
      break;
    }
  }

  return tax;
}
