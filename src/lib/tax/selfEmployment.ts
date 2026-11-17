import { getTaxYearData } from './activeYear';
import type { FilingStatus, SpouseW2Details, TaxYearData, TaxpayerW2Details } from './types';

export interface SelfEmploymentTaxInput {
  netProfit: number;
  filingStatus: FilingStatus;
  taxpayerW2: TaxpayerW2Details;
  spouseW2?: SpouseW2Details;
}

export interface SelfEmploymentTaxResult {
  netEarnings: number;
  taxableSelfEmploymentIncome: number;
  socialSecurityTax: number;
  medicareTax: number;
  selfEmploymentTax: number;
  additionalMedicareTax: number;
  deductibleHalf: number;
}

export function calculateSelfEmploymentTax(
  input: SelfEmploymentTaxInput,
  taxYearData: TaxYearData = getTaxYearData(),
): SelfEmploymentTaxResult {
  const netEarnings = Math.max(0, input.netProfit) * taxYearData.selfEmploymentNetEarningsFactor;
  const filingThreshold = taxYearData.selfEmploymentFilingThreshold;
  const taxableSelfEmploymentIncome = netEarnings < filingThreshold ? 0 : netEarnings;
  const isJointReturn = input.filingStatus === 'marriedJoint';
  const coveredW2SocialSecurityWages = Math.min(
    taxYearData.socialSecurityWageBase,
    Math.max(0, input.taxpayerW2.box3),
  );
  const remainingSocialSecurityWageBase = Math.max(
    0,
    taxYearData.socialSecurityWageBase - coveredW2SocialSecurityWages,
  );
  const socialSecurityEarnings = Math.min(taxableSelfEmploymentIncome, remainingSocialSecurityWageBase);
  const socialSecurityTax = socialSecurityEarnings * taxYearData.socialSecurityRate;
  const medicareTax = taxableSelfEmploymentIncome * taxYearData.medicareRate;
  const selfEmploymentTax = socialSecurityTax + medicareTax;
  const medicareWages = Math.max(0, input.taxpayerW2.box5)
    + (isJointReturn ? Math.max(0, input.spouseW2?.box5 ?? 0) : 0);
  const remainingAdditionalMedicareThreshold = Math.max(
    0,
    taxYearData.additionalMedicareThreshold[input.filingStatus] - medicareWages,
  );
  const additionalMedicareTax = Math.max(0, taxableSelfEmploymentIncome - remainingAdditionalMedicareThreshold)
    * taxYearData.additionalMedicareRate;

  return {
    netEarnings,
    taxableSelfEmploymentIncome,
    socialSecurityTax,
    medicareTax,
    selfEmploymentTax,
    additionalMedicareTax,
    deductibleHalf: selfEmploymentTax / 2,
  };
}
