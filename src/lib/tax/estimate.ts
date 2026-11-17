import { DEFAULT_TAX_YEAR, getTaxYearData } from './activeYear';
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
  TaxYearData,
  TaxpayerW2Details,
  W2ValidationWarning,
} from './types';

function getJointSpouseW2(
  filingStatus: FilingStatus,
  spouseW2: SpouseW2Details | undefined,
): SpouseW2Details {
  if (filingStatus !== 'marriedJoint') {
    return { box1: 0, box2: 0, box4: 0, box5: 0, box6: 0, hasMultipleEmployers: false };
  }

  return {
    box1: Math.max(0, spouseW2?.box1 ?? 0),
    box2: Math.max(0, spouseW2?.box2 ?? 0),
    box4: Math.max(0, spouseW2?.box4 ?? 0),
    box5: Math.max(0, spouseW2?.box5 ?? 0),
    box6: Math.max(0, spouseW2?.box6 ?? 0),
    hasMultipleEmployers: Boolean(spouseW2?.hasMultipleEmployers),
  };
}

function getMaximumEmployeeSocialSecurityWithholding(taxYearData: TaxYearData): number {
  return taxYearData.socialSecurityWageBase * taxYearData.socialSecurityRate / 2;
}

function calculateIndividualExcessSocialSecurity(
  box4Withholding: number,
  hasMultipleEmployers: boolean,
  maximumWithholding: number,
): number {
  if (!hasMultipleEmployers) {
    return 0;
  }

  return Math.max(0, box4Withholding - maximumWithholding);
}

function getExcessSocialSecurityWithholding(
  taxpayerW2: TaxpayerW2Details,
  spouseW2: SpouseW2Details,
  filingStatus: FilingStatus,
  taxYearData: TaxYearData,
): number {
  const maximumWithholding = getMaximumEmployeeSocialSecurityWithholding(taxYearData);
  const taxpayerEligibleExcess = calculateIndividualExcessSocialSecurity(
    taxpayerW2.box4,
    Boolean(taxpayerW2.hasMultipleEmployers),
    maximumWithholding,
  );
  const spouseEligibleExcess = filingStatus === 'marriedJoint'
    ? calculateIndividualExcessSocialSecurity(
        spouseW2.box4,
        Boolean(spouseW2.hasMultipleEmployers),
        maximumWithholding,
      )
    : 0;

  return taxpayerEligibleExcess + spouseEligibleExcess;
}

function getW2ValidationWarnings(
  filingStatus: FilingStatus,
  taxpayerW2: TaxpayerW2Details,
  spouseW2: SpouseW2Details,
  taxYearData: TaxYearData,
): W2ValidationWarning[] {
  const warnings: W2ValidationWarning[] = [];
  const maximumWithholding = getMaximumEmployeeSocialSecurityWithholding(taxYearData);

  if (taxpayerW2.box6 > 0 && taxpayerW2.box5 <= 0) {
    warnings.push({
      code: 'taxpayerMedicareWagesMissing',
      person: 'taxpayer',
      message: 'Your W-2 Medicare wages (Box 5) are blank or $0, so your Box 6 Medicare tax withheld was not credited toward Additional Medicare Tax.',
    });
  }

  if (filingStatus === 'marriedJoint' && spouseW2.box6 > 0 && spouseW2.box5 <= 0) {
    warnings.push({
      code: 'spouseMedicareWagesMissing',
      person: 'spouse',
      message: 'Spouse W-2 Medicare wages (Box 5) are blank or $0, so spouse Box 6 Medicare tax withheld was not credited toward Additional Medicare Tax.',
    });
  }

  if (
    Boolean(taxpayerW2.hasMultipleEmployers)
    && taxpayerW2.box4 > maximumWithholding
    && taxpayerW2.box3 <= taxYearData.socialSecurityWageBase
  ) {
    const wageBaseLabel = taxYearData.socialSecurityWageBase.toLocaleString('en-US');
    warnings.push({
      code: 'taxpayerExcessSocialSecurityWagesMismatch',
      person: 'taxpayer',
      message: `Your Box 4 Social Security tax withheld exceeds the annual maximum, but Box 3 Social Security wages do not exceed the $${wageBaseLabel} wage base. Enter Box 3 wages so self-employment Social Security tax is accurate.`,
    });
  }

  return warnings;
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
  taxYearData: TaxYearData;
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
    input.taxpayerW2,
    input.spouseW2,
    input.filingStatus,
    input.taxYearData,
  );
  const taxpayerEligibleBox6 = input.taxpayerW2.box5 > 0 ? input.taxpayerW2.box6 : 0;
  const spouseEligibleBox6 = input.spouseW2.box5 > 0 ? input.spouseW2.box6 : 0;
  const additionalMedicareTaxWithholding = Math.max(
    0,
    taxpayerEligibleBox6
      + spouseEligibleBox6
      - householdMedicareWages * input.taxYearData.medicareRate / 2,
  );
  const warnings = getW2ValidationWarnings(
    input.filingStatus,
    input.taxpayerW2,
    input.spouseW2,
    input.taxYearData,
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
    warnings,
  };
}

function getW2OnlyHouseholdFederalEstimate(
  taxYearData: TaxYearData,
  filingStatus: FilingStatus,
  taxpayerW2: EstimateInput['taxpayerW2'],
  spouseW2: SpouseW2Details,
  estimatedFederalPayments: number,
): HouseholdFederalEstimate {
  const householdIncome = taxpayerW2.box1 + spouseW2.box1;
  const taxableIncome = Math.max(
    0,
    householdIncome - taxYearData.standardDeduction[filingStatus],
  );
  const householdMedicareWages = taxpayerW2.box5 + spouseW2.box5;

  return getHouseholdFederalEstimate({
    taxYearData,
    filingStatus,
    taxpayerW2,
    spouseW2,
    estimatedFederalPayments,
    incomeTax: calculateFederalIncomeTax(taxableIncome, filingStatus, taxYearData),
    selfEmploymentTax: 0,
    additionalMedicareTax: Math.max(
      0,
      householdMedicareWages - taxYearData.additionalMedicareThreshold[filingStatus],
    ) * taxYearData.additionalMedicareRate,
  });
}

export function estimateTax(input: EstimateInput): EstimateResult {
  const taxYearData = getTaxYearData(input.taxYear ?? DEFAULT_TAX_YEAR);
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
    hasMultipleEmployers: Boolean(input.taxpayerW2.hasMultipleEmployers),
  };
  const estimatedFederalPayments = Math.max(0, input.estimatedFederalPayments);

  if (businessProfit < 0) {
    return {
      kind: 'loss',
      taxYear: taxYearData.year,
      grossReceipts,
      businessExpenses,
      businessLoss: Math.abs(businessProfit),
      cashDeficit: Math.abs(businessProfit),
      householdFederal: getW2OnlyHouseholdFederalEstimate(
        taxYearData,
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
      taxYear: taxYearData.year,
      grossReceipts,
      businessExpenses,
      businessProfit: 0,
      totalEstimatedTax: 0,
      takeHomeAnnual: 0,
      takeHomeMonthly: 0,
      reserveRate: 0,
      reservePercent: 0,
      householdFederal: getW2OnlyHouseholdFederalEstimate(
        taxYearData,
        input.filingStatus,
        taxpayerW2,
        spouseW2,
        estimatedFederalPayments,
      ),
    };
  }

  const selfEmployment = calculateSelfEmploymentTax(
    {
      netProfit: businessProfit,
      filingStatus: input.filingStatus,
      taxpayerW2,
      spouseW2,
    },
    taxYearData,
  );
  const standardDeduction = taxYearData.standardDeduction[input.filingStatus];
  const householdIncomeWithoutBusiness = taxpayerW2.box1 + spouseW2.box1;
  const taxableIncomeWithoutBusiness = Math.max(
    0,
    householdIncomeWithoutBusiness - standardDeduction,
  );
  const taxableIncomeBeforeQbi = Math.max(
    0,
    householdIncomeWithoutBusiness + businessProfit - selfEmployment.deductibleHalf - standardDeduction,
  );
  const qbiTreatment = calculateQbiDeduction(
    {
      filingStatus: input.filingStatus,
      qualifiedBusinessIncome: businessProfit - selfEmployment.deductibleHalf,
      taxableIncomeBeforeQbi,
      highIncomeDetails: input.qbiHighIncomeDetails,
    },
    taxYearData,
  );
  const taxableIncomeWithBusiness = Math.max(
    0,
    taxableIncomeBeforeQbi - qbiTreatment.deduction,
  );
  const householdIncomeTax = calculateFederalIncomeTax(
    taxableIncomeWithBusiness,
    input.filingStatus,
    taxYearData,
  );
  const federalIncomeTax = Math.max(
    0,
    householdIncomeTax - calculateFederalIncomeTax(
      taxableIncomeWithoutBusiness,
      input.filingStatus,
      taxYearData,
    ),
  );
  const householdAdditionalMedicareTax = Math.max(
    0,
    taxpayerW2.box5 + spouseW2.box5
      + selfEmployment.taxableSelfEmploymentIncome
      - taxYearData.additionalMedicareThreshold[input.filingStatus],
  ) * taxYearData.additionalMedicareRate;
  const householdFederal = getHouseholdFederalEstimate({
    taxYearData,
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
  const reservePercent = Math.ceil(Number((reserveRate * 100).toFixed(9)));

  const result: ProfitEstimate = {
    kind: 'profit',
    taxYear: taxYearData.year,
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
    qbiThreshold: taxYearData.qbi.threshold[input.filingStatus].threshold,
    taxableIncomeBeforeQbi,
  };

  return result;
}
