import { TAX_YEAR_2025 } from './data/2025';
import { TAX_YEAR_2026 } from './data/2026';
import type { SupportedTaxYear, TaxYearData } from './types';

export const DEFAULT_TAX_YEAR: SupportedTaxYear = 2026;

export const TAX_YEAR_DATA: Record<SupportedTaxYear, TaxYearData> = {
  2025: TAX_YEAR_2025,
  2026: TAX_YEAR_2026,
};

export const ACTIVE_TAX_YEAR = TAX_YEAR_DATA[DEFAULT_TAX_YEAR];

export function getTaxYearData(year: SupportedTaxYear = DEFAULT_TAX_YEAR): TaxYearData {
  return TAX_YEAR_DATA[year];
}
