import type { TaxYearData } from '../types';

// 2026 federal amounts are from IRS Rev. Proc. 2025-45 and 2026 draft forms.
// Update this module only after checking the tax year's official IRS sources.
// Sources: https://www.irs.gov/irb/2025-45_IRB
// https://www.irs.gov/pub/irs-dft/i8995--dft.pdf
// https://www.irs.gov/pub/irs-dft/i8959--dft.pdf
// QBI phase-in references: https://www.irs.gov/pub/irs-dft/f8995a--dft.pdf
// https://www.irs.gov/pub/irs-dft/f8995aa--dft.pdf
export const TAX_YEAR_2026: TaxYearData = {
  year: 2026,
  standardDeduction: {
    single: 16_100,
    marriedJoint: 32_200,
    marriedSeparate: 16_100,
    headOfHousehold: 24_150,
    qualifyingSurvivingSpouse: 32_200,
  },
  ordinaryBrackets: {
    single: [
      { ceiling: 12_400, rate: 0.1 },
      { ceiling: 50_400, rate: 0.12 },
      { ceiling: 105_700, rate: 0.22 },
      { ceiling: 201_775, rate: 0.24 },
      { ceiling: 256_225, rate: 0.32 },
      { ceiling: 640_600, rate: 0.35 },
      { ceiling: Number.POSITIVE_INFINITY, rate: 0.37 },
    ],
    marriedJoint: [
      { ceiling: 24_800, rate: 0.1 },
      { ceiling: 100_800, rate: 0.12 },
      { ceiling: 211_400, rate: 0.22 },
      { ceiling: 403_550, rate: 0.24 },
      { ceiling: 512_450, rate: 0.32 },
      { ceiling: 768_700, rate: 0.35 },
      { ceiling: Number.POSITIVE_INFINITY, rate: 0.37 },
    ],
    marriedSeparate: [
      { ceiling: 12_400, rate: 0.1 },
      { ceiling: 50_400, rate: 0.12 },
      { ceiling: 105_700, rate: 0.22 },
      { ceiling: 201_775, rate: 0.24 },
      { ceiling: 256_225, rate: 0.32 },
      { ceiling: 384_350, rate: 0.35 },
      { ceiling: Number.POSITIVE_INFINITY, rate: 0.37 },
    ],
    headOfHousehold: [
      { ceiling: 17_700, rate: 0.1 },
      { ceiling: 67_450, rate: 0.12 },
      { ceiling: 105_700, rate: 0.22 },
      { ceiling: 201_750, rate: 0.24 },
      { ceiling: 256_200, rate: 0.32 },
      { ceiling: 640_600, rate: 0.35 },
      { ceiling: Number.POSITIVE_INFINITY, rate: 0.37 },
    ],
    qualifyingSurvivingSpouse: [
      { ceiling: 24_800, rate: 0.1 },
      { ceiling: 100_800, rate: 0.12 },
      { ceiling: 211_400, rate: 0.22 },
      { ceiling: 403_550, rate: 0.24 },
      { ceiling: 512_450, rate: 0.32 },
      { ceiling: 768_700, rate: 0.35 },
      { ceiling: Number.POSITIVE_INFINITY, rate: 0.37 },
    ],
  },
  socialSecurityWageBase: 184_500,
  selfEmploymentNetEarningsFactor: 0.9235,
  selfEmploymentFilingThreshold: 400,
  socialSecurityRate: 0.124,
  medicareRate: 0.029,
  additionalMedicareRate: 0.009,
  additionalMedicareThreshold: {
    single: 200_000,
    marriedJoint: 250_000,
    marriedSeparate: 125_000,
    headOfHousehold: 200_000,
    qualifyingSurvivingSpouse: 200_000,
  },
  qbi: {
    deductionRate: 0.2,
    threshold: {
      single: { threshold: 201_750, phaseInRange: 75_000 },
      marriedJoint: { threshold: 403_500, phaseInRange: 150_000 },
      marriedSeparate: { threshold: 201_775, phaseInRange: 75_000 },
      headOfHousehold: { threshold: 201_750, phaseInRange: 75_000 },
      qualifyingSurvivingSpouse: { threshold: 201_750, phaseInRange: 75_000 },
    },
    minimumDeduction: 400,
    minimumQbi: 1_000,
  },
};
