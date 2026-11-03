import type { TaxYearData } from '../types';

// Verified on 2026-11-03. 2026 IRS forms and instructions were still drafts and are not used.
export const TAX_YEAR_2025: TaxYearData = {
  year: 2025,
  verifiedOn: '2026-11-03',
  sources: [
    {
      title: 'Federal income tax rates and brackets for 2025',
      url: 'https://www.irs.gov/filing/federal-income-tax-rates-and-brackets',
    },
    {
      title: 'Rev. Proc. 2025-32, including amended 2025 standard deductions',
      url: 'https://www.irs.gov/irb/2025-45_IRB',
    },
    {
      title: 'Instructions for Schedule SE (Form 1040), 2025',
      url: 'https://www.irs.gov/instructions/i1040sse',
    },
    {
      title: 'Instructions for Form 8959, 2025',
      url: 'https://www.irs.gov/instructions/i8959',
    },
    {
      title: 'Instructions for Forms 8995 and 8995-A, 2025',
      url: 'https://www.irs.gov/instructions/i8995',
    },
    {
      title: 'Instructions for Form 8995-A, 2025',
      url: 'https://www.irs.gov/instructions/i8995a',
    },
    {
      title: 'Correction to the 2025 Instructions for Form 8995',
      url: 'https://www.irs.gov/forms-pubs/corrections-to-the-instructions-on-how-to-calculate-the-taxable-income-before-qbi-deduction-for-form-8995',
    },
  ],
  standardDeduction: {
    single: 15_750,
    marriedJoint: 31_500,
    marriedSeparate: 15_750,
    headOfHousehold: 23_625,
    qualifyingSurvivingSpouse: 31_500,
  },
  ordinaryBrackets: {
    single: [
      { ceiling: 11_925, rate: 0.1 },
      { ceiling: 48_475, rate: 0.12 },
      { ceiling: 103_350, rate: 0.22 },
      { ceiling: 197_300, rate: 0.24 },
      { ceiling: 250_525, rate: 0.32 },
      { ceiling: 626_350, rate: 0.35 },
      { ceiling: Number.POSITIVE_INFINITY, rate: 0.37 },
    ],
    marriedJoint: [
      { ceiling: 23_850, rate: 0.1 },
      { ceiling: 96_950, rate: 0.12 },
      { ceiling: 206_700, rate: 0.22 },
      { ceiling: 394_600, rate: 0.24 },
      { ceiling: 501_050, rate: 0.32 },
      { ceiling: 751_600, rate: 0.35 },
      { ceiling: Number.POSITIVE_INFINITY, rate: 0.37 },
    ],
    marriedSeparate: [
      { ceiling: 11_925, rate: 0.1 },
      { ceiling: 48_475, rate: 0.12 },
      { ceiling: 103_350, rate: 0.22 },
      { ceiling: 197_300, rate: 0.24 },
      { ceiling: 250_525, rate: 0.32 },
      { ceiling: 375_800, rate: 0.35 },
      { ceiling: Number.POSITIVE_INFINITY, rate: 0.37 },
    ],
    headOfHousehold: [
      { ceiling: 17_000, rate: 0.1 },
      { ceiling: 64_850, rate: 0.12 },
      { ceiling: 103_350, rate: 0.22 },
      { ceiling: 197_300, rate: 0.24 },
      { ceiling: 250_500, rate: 0.32 },
      { ceiling: 626_350, rate: 0.35 },
      { ceiling: Number.POSITIVE_INFINITY, rate: 0.37 },
    ],
    qualifyingSurvivingSpouse: [
      { ceiling: 23_850, rate: 0.1 },
      { ceiling: 96_950, rate: 0.12 },
      { ceiling: 206_700, rate: 0.22 },
      { ceiling: 394_600, rate: 0.24 },
      { ceiling: 501_050, rate: 0.32 },
      { ceiling: 751_600, rate: 0.35 },
      { ceiling: Number.POSITIVE_INFINITY, rate: 0.37 },
    ],
  },
  socialSecurityWageBase: 176_100,
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
      single: { threshold: 197_300, phaseInRange: 50_000 },
      marriedJoint: { threshold: 394_600, phaseInRange: 100_000 },
      marriedSeparate: { threshold: 197_300, phaseInRange: 50_000 },
      headOfHousehold: { threshold: 197_300, phaseInRange: 50_000 },
      qualifyingSurvivingSpouse: { threshold: 197_300, phaseInRange: 50_000 },
    },
    minimumDeduction: 0,
    minimumQbi: 0,
  },
};
