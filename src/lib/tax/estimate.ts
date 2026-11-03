import { ACTIVE_TAX_YEAR } from './activeYear';
import { calculateFederalIncomeTax } from './federal';
import { calculateQbiDeduction } from './qbi';
import { calculateSelfEmploymentTax } from './selfEmployment';
import type {
  EstimateInput,
  EstimateResult,
  FilingStatus,
  ProfitEstimate,
  SpouseW2Wages,
} from './types';

function getJointSpouseWages(
  filingStatus: FilingStatus,
  spouseW2: SpouseW2Wages | undefined,
): SpouseW2Wages {
  if (filingStatus !== 'marriedJoint') {
    return { box1: 0, box5: 0 };
  }

  return {
    box1: Math.max(0, spouseW2?.box1 ?? 0),
    box5: Math.max(0, spouseW2?.box5 ?? 0),
  };
}

export function estimateTax(input: EstimateInput): EstimateResult {
  const grossReceipts = Math.max(0, input.grossReceipts);
  const businessExpenses = Math.max(0, input.businessExpenses);
  const businessProfit = grossReceipts - businessExpenses;

  if (businessProfit < 0) {
    return {
      kind: 'loss',
      grossReceipts,
      businessExpenses,
      businessLoss: Math.abs(businessProfit),
      cashDeficit: Math.abs(businessProfit),
    };
  }

  if (businessProfit === 0) {
    return {
      kind: 'breakEven',
      grossReceipts,
      businessExpenses,
      businessProfit: 0,
    };
  }

  const spouseW2 = getJointSpouseWages(input.filingStatus, input.spouseW2);
  const taxpayerW2 = {
    box1: Math.max(0, input.taxpayerW2.box1),
    box3: Math.max(0, input.taxpayerW2.box3),
    box5: Math.max(0, input.taxpayerW2.box5),
  };
  const otherTaxableIncome = Math.max(0, input.otherTaxableIncome);
  const selfEmployment = calculateSelfEmploymentTax({
    netProfit: businessProfit,
    filingStatus: input.filingStatus,
    taxpayerW2,
    spouseW2,
  });
  const standardDeduction = ACTIVE_TAX_YEAR.standardDeduction[input.filingStatus];
  const householdIncomeWithoutBusiness = otherTaxableIncome + taxpayerW2.box1 + spouseW2.box1;
  const taxableIncomeWithoutBusiness = Math.max(
    0,
    householdIncomeWithoutBusiness - standardDeduction,
  );
  const taxableIncomeBeforeQbi = Math.max(
    0,
    householdIncomeWithoutBusiness + businessProfit - selfEmployment.deductibleHalf - standardDeduction,
  );
  const qbiTreatment = calculateQbiDeduction({
    filingStatus: input.filingStatus,
    qualifiedBusinessIncome: businessProfit - selfEmployment.deductibleHalf,
    taxableIncomeBeforeQbi,
    highIncomeDetails: input.qbiHighIncomeDetails,
  });
  const taxableIncomeWithBusiness = Math.max(
    0,
    taxableIncomeBeforeQbi - qbiTreatment.deduction,
  );
  const federalIncomeTax = Math.max(
    0,
    calculateFederalIncomeTax(taxableIncomeWithBusiness, input.filingStatus)
      - calculateFederalIncomeTax(taxableIncomeWithoutBusiness, input.filingStatus),
  );
  const stateTax = input.stateReserveRate === null
    ? {
        status: 'omitted' as const,
        amount: 0 as const,
        reason: 'No state or local reserve rate was entered.',
      }
    : {
        status: 'included' as const,
        amount: businessProfit * Math.max(0, input.stateReserveRate),
        rate: Math.max(0, input.stateReserveRate),
      };
  const totalEstimatedTax = federalIncomeTax
    + selfEmployment.selfEmploymentTax
    + selfEmployment.additionalMedicareTax
    + stateTax.amount;
  const takeHomeAnnual = businessProfit - totalEstimatedTax;
  const reserveRate = totalEstimatedTax / grossReceipts;
  const reservePercent = Math.ceil(reserveRate * 100);

  const result: ProfitEstimate = {
    kind: 'profit',
    grossReceipts,
    businessExpenses,
    businessProfit,
    federalIncomeTax,
    selfEmploymentTax: selfEmployment.selfEmploymentTax,
    additionalMedicareTax: selfEmployment.additionalMedicareTax,
    stateTax,
    totalEstimatedTax,
    takeHomeAnnual,
    takeHomeMonthly: takeHomeAnnual / 12,
    reserveRate,
    reservePercent,
    qbiTreatment,
    qbiThreshold: ACTIVE_TAX_YEAR.qbi.threshold[input.filingStatus].threshold,
    taxableIncomeBeforeQbi,
  };

  return result;
}
