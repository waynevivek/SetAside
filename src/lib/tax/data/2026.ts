import type { TaxYearData } from '../types';

// Planning figures verified on 2026-11-17 from Rev. Proc. 2025-32 (IRB 2025-45),
// IRS Publication 505 (2026), and SSA 2026 Contribution and Benefit Base.
// Year-end 2026 return forms/instructions (Form 8959, Form 8995, Form 8995-A) remain IRS drafts ahead of filing season.
export const TAX_YEAR_2026: TaxYearData = {
  year: 2026,
  verifiedOn: '2026-11-17',
  verificationStatus: 'planningFiguresWithDraftReturnForms',
  sources: [
    {
      title: 'Rev. Proc. 2025-32 (IRB 2025-45: 2026 tax rate tables, standard deductions, QBI thresholds, and IRC § 199A(i))',
      url: 'https://www.irs.gov/irb/2025-45_IRB',
    },
    {
      title: 'IRS Publication 505 (2026), Tax Withholding and Estimated Tax',
      url: 'https://www.irs.gov/publications/p505',
    },
    {
      title: 'SSA Contribution and Benefit Base (2026 Social Security wage base)',
      url: 'https://www.ssa.gov/oact/cola/cbb.html',
    },
    {
      title: '2026 Form 1040-ES, Estimated Tax for Individuals',
      url: 'https://www.irs.gov/forms-pubs/about-form-1040-es',
    },
    {
      title: '2026 Form 8995 and Instructions (Draft)',
      url: 'https://www.irs.gov/forms-pubs/about-form-8995',
    },
    {
      title: '2026 Form 8959 and Instructions (Draft)',
      url: 'https://www.irs.gov/forms-pubs/about-form-8959',
    },
  ],
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
