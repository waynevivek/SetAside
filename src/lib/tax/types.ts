import type { StateCode } from './states';

export const FILING_STATUSES = [
  'single',
  'marriedJoint',
  'marriedSeparate',
  'headOfHousehold',
  'qualifyingSurvivingSpouse',
] as const;

export type FilingStatus = (typeof FILING_STATUSES)[number];

export interface TaxpayerW2Details {
  box1: number;
  box2: number;
  box3: number;
  box4: number;
  box5: number;
  box6: number;
}

export interface SpouseW2Details {
  box1: number;
  box2: number;
  box4: number;
  box5: number;
  box6: number;
}

export type SstbAnswer = 'yes' | 'no' | 'unsure';

export interface QbiHighIncomeDetails {
  sstb: SstbAnswer;
  qualifiedPropertyUbia: number | null;
}

export interface EstimateInput {
  filingStatus: FilingStatus;
  grossReceipts: number;
  businessExpenses: number;
  estimatedFederalPayments: number;
  taxpayerW2: TaxpayerW2Details;
  spouseW2?: SpouseW2Details;
  stateCode: StateCode | null;
  stateReserveRate: number | null;
  qbiHighIncomeDetails?: QbiHighIncomeDetails;
}

export interface TaxBracket {
  ceiling: number;
  rate: number;
}

export interface QbiThresholds {
  threshold: number;
  phaseInRange: number;
}

export interface TaxYearSource {
  title: string;
  url: string;
}

export interface TaxYearData {
  year: number;
  verifiedOn: string;
  sources: readonly TaxYearSource[];
  standardDeduction: Record<FilingStatus, number>;
  ordinaryBrackets: Record<FilingStatus, readonly TaxBracket[]>;
  socialSecurityWageBase: number;
  selfEmploymentNetEarningsFactor: number;
  selfEmploymentFilingThreshold: number;
  socialSecurityRate: number;
  medicareRate: number;
  additionalMedicareRate: number;
  additionalMedicareThreshold: Record<FilingStatus, number>;
  qbi: {
    deductionRate: number;
    threshold: Record<FilingStatus, QbiThresholds>;
    minimumDeduction: number;
    minimumQbi: number;
  };
}

export type QbiTreatment =
  | { status: 'included'; deduction: number; reason: string }
  | { status: 'omitted'; deduction: 0; reason: string }
  | { status: 'notEligible'; deduction: 0; reason: string };

export type StateTaxTreatment =
  | { status: 'included'; amount: number; rate: number }
  | { status: 'omitted'; amount: 0; reason: string };

export interface HouseholdFederalPayments {
  federalIncomeTaxWithholding: number;
  estimatedFederalPayments: number;
  excessSocialSecurityWithholding: number;
  additionalMedicareTaxWithholding: number;
  total: number;
}

export type FederalBalance =
  | { kind: 'amountDue'; amount: number }
  | { kind: 'estimatedOverpayment'; amount: number }
  | { kind: 'settled'; amount: 0 };

export interface HouseholdFederalEstimate {
  incomeTax: number;
  selfEmploymentTax: number;
  additionalMedicareTax: number;
  liability: number;
  payments: HouseholdFederalPayments;
  balance: FederalBalance;
}

export interface BreakEvenEstimate {
  kind: 'breakEven';
  grossReceipts: number;
  businessExpenses: number;
  businessProfit: 0;
  householdFederal: HouseholdFederalEstimate;
}

export interface LossEstimate {
  kind: 'loss';
  grossReceipts: number;
  businessExpenses: number;
  businessLoss: number;
  cashDeficit: number;
  householdFederal: HouseholdFederalEstimate;
}

export interface ProfitEstimate {
  kind: 'profit';
  grossReceipts: number;
  businessExpenses: number;
  businessProfit: number;
  federalIncomeTax: number;
  selfEmploymentTax: number;
  additionalMedicareTax: number;
  stateTax: StateTaxTreatment;
  householdFederal: HouseholdFederalEstimate;
  totalEstimatedTax: number;
  takeHomeAnnual: number;
  takeHomeMonthly: number;
  reserveRate: number;
  reservePercent: number;
  qbiTreatment: QbiTreatment;
  qbiThreshold: number;
  taxableIncomeBeforeQbi: number;
}

export type EstimateResult = ProfitEstimate | BreakEvenEstimate | LossEstimate;
