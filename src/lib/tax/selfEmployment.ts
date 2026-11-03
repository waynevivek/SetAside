import { ACTIVE_TAX_YEAR } from './activeYear';
import type { FilingStatus, SpouseW2Wages, TaxpayerW2Wages } from './types';

export interface SelfEmploymentTaxInput {
  netProfit: number;
  filingStatus: FilingStatus;
  taxpayerW2: TaxpayerW2Wages;
  spouseW2?: SpouseW2Wages;
}

export interface SelfEmploymentTaxResult {
  netEarnings: number;
  socialSecurityTax: number;
  medicareTax: number;
  selfEmploymentTax: number;
  additionalMedicareTax: number;
  deductibleHalf: number;
}

export function calculateSelfEmploymentTax(
  input: SelfEmploymentTaxInput,
): SelfEmploymentTaxResult {
  const netEarnings = Math.max(0, input.netProfit) * ACTIVE_TAX_YEAR.selfEmploymentNetEarningsFactor;
  const filingThreshold = ACTIVE_TAX_YEAR.selfEmploymentFilingThreshold;
  const isJointReturn = input.filingStatus === 'marriedJoint';
  const coveredW2SocialSecurityWages = Math.min(
    ACTIVE_TAX_YEAR.socialSecurityWageBase,
    Math.max(0, input.taxpayerW2.box3),
  );
  const remainingSocialSecurityWageBase = Math.max(
    0,
    ACTIVE_TAX_YEAR.socialSecurityWageBase - coveredW2SocialSecurityWages,
  );
  const socialSecurityEarnings = Math.min(netEarnings, remainingSocialSecurityWageBase);
  const socialSecurityTax = netEarnings < filingThreshold
    ? 0
    : socialSecurityEarnings * ACTIVE_TAX_YEAR.socialSecurityRate;
  const medicareTax = netEarnings < filingThreshold
    ? 0
    : netEarnings * ACTIVE_TAX_YEAR.medicareRate;
  const selfEmploymentTax = socialSecurityTax + medicareTax;
  const medicareWages = Math.max(0, input.taxpayerW2.box5)
    + (isJointReturn ? Math.max(0, input.spouseW2?.box5 ?? 0) : 0);
  const remainingAdditionalMedicareThreshold = Math.max(
    0,
    ACTIVE_TAX_YEAR.additionalMedicareThreshold[input.filingStatus] - medicareWages,
  );
  const additionalMedicareTax = Math.max(0, netEarnings - remainingAdditionalMedicareThreshold)
    * ACTIVE_TAX_YEAR.additionalMedicareRate;

  return {
    netEarnings,
    socialSecurityTax,
    medicareTax,
    selfEmploymentTax,
    additionalMedicareTax,
    deductibleHalf: selfEmploymentTax / 2,
  };
}
