import { ACTIVE_TAX_YEAR } from './activeYear';
import { calculateFederalIncomeTax } from './federal';
import { calculateQbiDeduction } from './qbi';
import { calculateSelfEmploymentTax } from './selfEmployment';
import type {
  EstimateInput,
  EstimateResult,
  FederalBalance,
  FilingStatus,
  HouseholdFederalEstimate,
  ProfitEstimate,
  SpouseW2Details,
} from './types';

function getJointSpouseW2(
  filingStatus: FilingStatus,
  spouseW2: SpouseW2Details | undefined,
): SpouseW2Details {
  if (filingStatus !== 'marriedJoint') {
    return { box1: 0, box2: 0, box4: 0, box5: 0, box6: 0 };
  }

  return {
    box1: Math.max(0, spouseW2?.box1 ?? 0),
    box2: Math.max(0, spouseW2?.box2 ?? 0),
    box4: Math.max(0, spouseW2?.box4 ?? 0),
    box5: Math.max(0, spouseW2?.box5 ?? 0),
    box6: Math.max(0, spouseW2?.box6 ?? 0),
  };
}

function getExcessSocialSecurityWithholding(
  taxpayerBox3Wages: number,
  taxpayerBox4Withholding: number,
  spouseBox4Withholding: number,
  filingStatus: FilingStatus,
): number {
  const wageBase = ACTIVE_TAX_YEAR.socialSecurityWageBase;
  const maximumWithholding = wageBase * ACTIVE_TAX_YEAR.socialSecurityRate / 2;
  const taxpayerEligibleExcess = taxpayerBox3Wages > wageBase
    ? Math.max(0, taxpayerBox4Withholding - maximumWithholding)
    : 0;
  const spouseEligibleExcess = filingStatus === 'marriedJoint'
    ? Math.max(0, spouseBox4Withholding - maximumWithholding)
    : 0;

  return taxpayerEligibleExcess + spouseEligibleExcess;
}

function getFederalBalance(liability: number, payments: number): FederalBalance {
  const difference = liability - payments;

  if (difference > 0) {
    return { kind: 'amountDue', amount: difference };
  }

  if (difference < 0) {
    return { kind: 'estimatedOverpayment', amount: Math.abs(difference) };
  }

  return { kind: 'settled', amount: 0 };
}

function getHouseholdFederalEstimate(input: {
  filingStatus: FilingStatus;
  taxpayerW2: EstimateInput['taxpayerW2'];
  spouseW2: SpouseW2Details;
  estimatedFederalPayments: number;
  incomeTax: number;
  selfEmploymentTax: number;
  additionalMedicareTax: number;
}): HouseholdFederalEstimate {
  const householdMedicareWages = input.taxpayerW2.box5 + input.spouseW2.box5;
  const federalIncomeTaxWithholding = input.taxpayerW2.box2 + input.spouseW2.box2;
  const excessSocialSecurityWithholding = getExcessSocialSecurityWithholding(
    input.taxpayerW2.box3,
    input.taxpayerW2.box4,
    input.spouseW2.box4,
    input.filingStatus,
  );
  const additionalMedicareTaxWithholding = Math.max(
    0,
    input.taxpayerW2.box6
      + input.spouseW2.box6
      - householdMedicareWages * ACTIVE_TAX_YEAR.medicareRate / 2,
  );
  const payments = {
    federalIncomeTaxWithholding,
    estimatedFederalPayments: input.estimatedFederalPayments,
    excessSocialSecurityWithholding,
    additionalMedicareTaxWithholding,
    total: federalIncomeTaxWithholding
      + input.estimatedFederalPayments
      + excessSocialSecurityWithholding
      + additionalMedicareTaxWithholding,
  };
  const liability = input.incomeTax
    + input.selfEmploymentTax
    + input.additionalMedicareTax;

  return {
    incomeTax: input.incomeTax,
    selfEmploymentTax: input.selfEmploymentTax,
    additionalMedicareTax: input.additionalMedicareTax,
    liability,
    payments,
    balance: getFederalBalance(liability, payments.total),
  };
}

function getW2OnlyHouseholdFederalEstimate(
  filingStatus: FilingStatus,
  taxpayerW2: EstimateInput['taxpayerW2'],
  spouseW2: SpouseW2Details,
  estimatedFederalPayments: number,
): HouseholdFederalEstimate {
  const householdIncome = taxpayerW2.box1 + spouseW2.box1;
  const taxableIncome = Math.max(
    0,
    householdIncome - ACTIVE_TAX_YEAR.standardDeduction[filingStatus],
  );
  const householdMedicareWages = taxpayerW2.box5 + spouseW2.box5;

  return getHouseholdFederalEstimate({
    filingStatus,
    taxpayerW2,
    spouseW2,
    estimatedFederalPayments,
    incomeTax: calculateFederalIncomeTax(taxableIncome, filingStatus),
    selfEmploymentTax: 0,
    additionalMedicareTax: Math.max(
      0,
      householdMedicareWages - ACTIVE_TAX_YEAR.additionalMedicareThreshold[filingStatus],
    ) * ACTIVE_TAX_YEAR.additionalMedicareRate,
  });
}

export function estimateTax(input: EstimateInput): EstimateResult {
  const grossReceipts = Math.max(0, input.grossReceipts);
  const businessExpenses = Math.max(0, input.businessExpenses);
  const businessProfit = grossReceipts - businessExpenses;
  const spouseW2 = getJointSpouseW2(input.filingStatus, input.spouseW2);
  const taxpayerW2 = {
    box1: Math.max(0, input.taxpayerW2.box1),
    box2: Math.max(0, input.taxpayerW2.box2),
    box3: Math.max(0, input.taxpayerW2.box3),
    box4: Math.max(0, input.taxpayerW2.box4),
    box5: Math.max(0, input.taxpayerW2.box5),
    box6: Math.max(0, input.taxpayerW2.box6),
  };
  const estimatedFederalPayments = Math.max(0, input.estimatedFederalPayments);

  if (businessProfit < 0) {
    return {
      kind: 'loss',
      grossReceipts,
      businessExpenses,
      businessLoss: Math.abs(businessProfit),
      cashDeficit: Math.abs(businessProfit),
      householdFederal: getW2OnlyHouseholdFederalEstimate(
        input.filingStatus,
        taxpayerW2,
        spouseW2,
        estimatedFederalPayments,
      ),
    };
  }

  if (businessProfit === 0) {
    return {
      kind: 'breakEven',
      grossReceipts,
      businessExpenses,
      businessProfit: 0,
      householdFederal: getW2OnlyHouseholdFederalEstimate(
        input.filingStatus,
        taxpayerW2,
        spouseW2,
        estimatedFederalPayments,
      ),
    };
  }

  const selfEmployment = calculateSelfEmploymentTax({
    netProfit: businessProfit,
    filingStatus: input.filingStatus,
    taxpayerW2,
    spouseW2,
  });
  const standardDeduction = ACTIVE_TAX_YEAR.standardDeduction[input.filingStatus];
  const householdIncomeWithoutBusiness = taxpayerW2.box1 + spouseW2.box1;
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
  const householdIncomeTax = calculateFederalIncomeTax(
    taxableIncomeWithBusiness,
    input.filingStatus,
  );
  const federalIncomeTax = Math.max(
    0,
    householdIncomeTax - calculateFederalIncomeTax(taxableIncomeWithoutBusiness, input.filingStatus),
  );
  const householdAdditionalMedicareTax = Math.max(
    0,
    taxpayerW2.box5 + spouseW2.box5
      + selfEmployment.netEarnings
      - ACTIVE_TAX_YEAR.additionalMedicareThreshold[input.filingStatus],
  ) * ACTIVE_TAX_YEAR.additionalMedicareRate;
  const householdFederal = getHouseholdFederalEstimate({
    filingStatus: input.filingStatus,
    taxpayerW2,
    spouseW2,
    estimatedFederalPayments,
    incomeTax: householdIncomeTax,
    selfEmploymentTax: selfEmployment.selfEmploymentTax,
    additionalMedicareTax: householdAdditionalMedicareTax,
  });
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
    householdFederal,
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
