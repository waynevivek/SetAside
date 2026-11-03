import { ACTIVE_TAX_YEAR } from './activeYear';
import type { FilingStatus } from './types';

export function calculateFederalIncomeTax(
  taxableIncome: number,
  filingStatus: FilingStatus,
): number {
  const income = Math.max(0, taxableIncome);
  const brackets = ACTIVE_TAX_YEAR.ordinaryBrackets[filingStatus];
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
