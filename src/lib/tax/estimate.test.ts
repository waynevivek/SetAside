import assert from 'node:assert/strict';
import test from 'node:test';
import { estimateTax } from './estimate';
import { FILING_STATUSES } from './types';
import type { EstimateInput, FilingStatus } from './types';

type SingleEstimateOverrides = Omit<Partial<EstimateInput>, 'taxpayerW2' | 'spouseW2'> & {
  taxpayerW2?: Partial<EstimateInput['taxpayerW2']>;
  spouseW2?: Partial<NonNullable<EstimateInput['spouseW2']>>;
};

function roundToFourDecimals(value: number): number {
  return Math.round(value * 10_000) / 10_000;
}

function estimateSingle(overrides: SingleEstimateOverrides = {}) {
  const { taxpayerW2, spouseW2, ...otherOverrides } = overrides;

  return estimateTax({
    filingStatus: 'single',
    grossReceipts: 10_000,
    businessExpenses: 0,
    estimatedFederalPayments: 0,
    taxpayerW2: {
      box1: 0,
      box2: 0,
      box3: 0,
      box4: 0,
      box5: 0,
      box6: 0,
      ...taxpayerW2,
    },
    spouseW2: {
      box1: 0,
      box2: 0,
      box4: 0,
      box5: 0,
      box6: 0,
      ...spouseW2,
    },
    stateCode: null,
    stateReserveRate: 0,
    ...otherOverrides,
  });
}

test('uses verified 2025 federal data for sole-proprietor estimates', () => {
  const expectedByFilingStatus: Record<FilingStatus, {
    taxableIncomeBeforeQbi: number;
    federalIncomeTax: number;
  }> = {
    single: { taxableIncomeBeforeQbi: 30_717.6125, federalIncomeTax: 2_710.3908 },
    marriedJoint: { taxableIncomeBeforeQbi: 14_967.6125, federalIncomeTax: 1_197.409 },
    marriedSeparate: { taxableIncomeBeforeQbi: 30_717.6125, federalIncomeTax: 2_710.3908 },
    headOfHousehold: { taxableIncomeBeforeQbi: 22_842.6125, federalIncomeTax: 1_852.8908 },
    qualifyingSurvivingSpouse: { taxableIncomeBeforeQbi: 14_967.6125, federalIncomeTax: 1_197.409 },
  };

  for (const filingStatus of FILING_STATUSES) {
    const expected = expectedByFilingStatus[filingStatus];
    const result = estimateTax({
      filingStatus,
      grossReceipts: 50_000,
      businessExpenses: 0,
      estimatedFederalPayments: 0,
      taxpayerW2: { box1: 0, box2: 0, box3: 0, box4: 0, box5: 0, box6: 0 },
      spouseW2: { box1: 0, box2: 0, box4: 0, box5: 0, box6: 0 },
      stateCode: null,
      stateReserveRate: 0,
    });

    if (result.kind !== 'profit') {
      throw new Error(`Expected a profit estimate for ${filingStatus}.`);
    }

    assert.equal(roundToFourDecimals(result.selfEmploymentTax), 7_064.775);
    assert.equal(roundToFourDecimals(result.taxableIncomeBeforeQbi), expected.taxableIncomeBeforeQbi);
    assert.equal(roundToFourDecimals(result.federalIncomeTax), expected.federalIncomeTax);
    assert.equal(roundToFourDecimals(result.householdFederal.incomeTax), expected.federalIncomeTax);
    assert.equal(
      roundToFourDecimals(result.householdFederal.liability),
      roundToFourDecimals(expected.federalIncomeTax + 7_064.775),
    );
    assert.equal(result.householdFederal.balance.kind, 'amountDue');
  }
});

test('reports household federal liability and estimated overpayment separately', () => {
  const result = estimateTax({
    filingStatus: 'single',
    grossReceipts: 50_000,
    businessExpenses: 0,
    estimatedFederalPayments: 10_000,
    taxpayerW2: { box1: 0, box2: 0, box3: 0, box4: 0, box5: 0, box6: 0 },
    spouseW2: { box1: 0, box2: 0, box4: 0, box5: 0, box6: 0 },
    stateCode: null,
    stateReserveRate: 0,
  });

  if (result.kind !== 'profit') {
    throw new Error('Expected a profit estimate.');
  }

  assert.equal(roundToFourDecimals(result.householdFederal.liability), 9_775.1658);
  assert.equal(result.householdFederal.payments.total, 10_000);
  assert.equal(result.householdFederal.balance.kind, 'estimatedOverpayment');
  assert.equal(roundToFourDecimals(result.householdFederal.balance.amount), 224.8342);
});

test('credits eligible spouse W-2 overwithholding on a joint household estimate', () => {
  const result = estimateTax({
    filingStatus: 'marriedJoint',
    grossReceipts: 1_000,
    businessExpenses: 0,
    estimatedFederalPayments: 1_000,
    taxpayerW2: { box1: 0, box2: 0, box3: 0, box4: 0, box5: 0, box6: 0 },
    spouseW2: { box1: 200_000, box2: 25_000, box4: 12_400, box5: 280_000, box6: 4_780 },
    stateCode: null,
    stateReserveRate: 0,
  });

  if (result.kind !== 'profit') {
    throw new Error('Expected a profit estimate.');
  }

  assert.equal(roundToFourDecimals(result.householdFederal.liability), 27_481.173);
  assert.equal(result.householdFederal.payments.federalIncomeTaxWithholding, 25_000);
  assert.equal(result.householdFederal.payments.estimatedFederalPayments, 1_000);
  assert.equal(roundToFourDecimals(result.householdFederal.payments.excessSocialSecurityWithholding), 1_481.8);
  assert.equal(result.householdFederal.payments.additionalMedicareTaxWithholding, 720);
  assert.equal(roundToFourDecimals(result.householdFederal.payments.total), 28_201.8);
  assert.equal(result.householdFederal.balance.kind, 'estimatedOverpayment');
  assert.equal(roundToFourDecimals(result.householdFederal.balance.amount), 720.627);
});

test('credits taxpayer excess Social Security withholding after the wage base is exceeded', () => {
  const result = estimateTax({
    filingStatus: 'single',
    grossReceipts: 1_000,
    businessExpenses: 0,
    estimatedFederalPayments: 0,
    taxpayerW2: {
      box1: 150_000,
      box2: 25_000,
      box3: 180_000,
      box4: 12_000,
      box5: 180_000,
      box6: 2_610,
    },
    spouseW2: { box1: 0, box2: 0, box4: 0, box5: 0, box6: 0 },
    stateCode: null,
    stateReserveRate: 0,
  });

  if (result.kind !== 'profit') {
    throw new Error('Expected a profit estimate.');
  }

  assert.equal(roundToFourDecimals(result.householdFederal.payments.excessSocialSecurityWithholding), 1_081.8);
  assert.equal(result.householdFederal.payments.additionalMedicareTaxWithholding, 0);
});

test('retains the W-2 household estimate at break-even', () => {
  const result = estimateTax({
    filingStatus: 'single',
    grossReceipts: 60_000,
    businessExpenses: 60_000,
    estimatedFederalPayments: 1_000,
    taxpayerW2: { box1: 60_000, box2: 4_000, box3: 60_000, box4: 3_720, box5: 60_000, box6: 870 },
    spouseW2: { box1: 0, box2: 0, box4: 0, box5: 0, box6: 0 },
    stateCode: null,
    stateReserveRate: 0,
  });

  assert.equal(result.kind, 'breakEven');
  if (result.kind !== 'breakEven') {
    throw new Error('Expected a break-even estimate.');
  }

  assert.equal(roundToFourDecimals(result.householdFederal.incomeTax), 5_071.5);
  assert.equal(result.totalEstimatedTax, 0);
  assert.equal(result.takeHomeAnnual, 0);
  assert.equal(result.takeHomeMonthly, 0);
  assert.equal(result.reserveRate, 0);
  assert.equal(result.reservePercent, 0);
  assert.equal(result.householdFederal.selfEmploymentTax, 0);
  assert.equal(result.householdFederal.payments.federalIncomeTaxWithholding, 4_000);
  assert.equal(result.householdFederal.payments.estimatedFederalPayments, 1_000);
  assert.equal(result.householdFederal.balance.kind, 'amountDue');
  assert.equal(roundToFourDecimals(result.householdFederal.balance.amount), 71.5);
});

test('shows a W-2 household estimate for a business loss without applying the loss', () => {
  const result = estimateTax({
    filingStatus: 'single',
    grossReceipts: 10_000,
    businessExpenses: 20_000,
    estimatedFederalPayments: 0,
    taxpayerW2: { box1: 60_000, box2: 0, box3: 60_000, box4: 3_720, box5: 60_000, box6: 870 },
    spouseW2: { box1: 0, box2: 0, box4: 0, box5: 0, box6: 0 },
    stateCode: null,
    stateReserveRate: 0,
  });

  assert.equal(result.kind, 'loss');
  if (result.kind !== 'loss') {
    throw new Error('Expected a loss estimate.');
  }

  assert.equal(roundToFourDecimals(result.householdFederal.incomeTax), 5_071.5);
  assert.equal(result.householdFederal.selfEmploymentTax, 0);
  assert.equal(result.householdFederal.additionalMedicareTax, 0);
  assert.equal(result.householdFederal.liability, 5_071.5);
  assert.equal(result.businessLoss, 10_000);
  assert.equal('takeHomeAnnual' in result, false);
  assert.equal('reservePercent' in result, false);
});

test('attributes household federal tax changes to the business and reconciles take-home', () => {
  const taxpayerW2 = {
    box1: 200_000,
    box2: 0,
    box3: 176_100,
    box4: 10_918.2,
    box5: 210_000,
    box6: 3_135,
  };
  const baseline = estimateSingle({
    grossReceipts: 0,
    businessExpenses: 0,
    taxpayerW2,
  });
  const result = estimateSingle({
    grossReceipts: 20_000,
    taxpayerW2,
    stateReserveRate: 0.05,
    qbiHighIncomeDetails: { sstb: 'no', qualifiedPropertyUbia: 0 },
  });

  if (baseline.kind !== 'breakEven' || result.kind !== 'profit') {
    throw new Error('Expected W-2 baseline and profitable business estimates.');
  }

  const attributableFederalTax = result.federalIncomeTax
    + result.selfEmploymentTax
    + result.additionalMedicareTax;
  assert.equal(roundToFourDecimals(result.additionalMedicareTax), 166.23);
  assert.equal(
    roundToFourDecimals(result.householdFederal.liability - baseline.householdFederal.liability),
    roundToFourDecimals(attributableFederalTax),
  );
  assert.equal(result.householdFederal.payments.additionalMedicareTaxWithholding, 90);
  assert.equal(result.stateTax.status, 'included');
  assert.equal(roundToFourDecimals(result.stateTax.amount), 1_000);
  assert.equal(
    roundToFourDecimals(result.totalEstimatedTax),
    roundToFourDecimals(attributableFederalTax + 1_000),
  );
  assert.equal(
    roundToFourDecimals(result.businessExpenses + result.totalEstimatedTax + result.takeHomeAnnual),
    result.grossReceipts,
  );
  assert.equal(result.reservePercent, Math.ceil(result.totalEstimatedTax / result.grossReceipts * 100));
});

test('applies the QBI threshold, phase-in, SSTB, and qualified-property limits', () => {
  const atThreshold = estimateSingle({
    taxpayerW2: { box1: 203_756.4775 },
  });
  const aboveThresholdWithoutDetails = estimateSingle({
    taxpayerW2: { box1: 203_757.4775 },
  });
  const phasedNonSstbWithoutProperty = estimateSingle({
    taxpayerW2: { box1: 204_000 },
    qbiHighIncomeDetails: { sstb: 'no', qualifiedPropertyUbia: 0 },
  });
  const phasedNonSstbWithProperty = estimateSingle({
    taxpayerW2: { box1: 204_000 },
    qbiHighIncomeDetails: { sstb: 'no', qualifiedPropertyUbia: 100_000 },
  });
  const phasedSstb = estimateSingle({
    taxpayerW2: { box1: 204_000 },
    qbiHighIncomeDetails: { sstb: 'yes', qualifiedPropertyUbia: 100_000 },
  });
  const fullyPhasedOutSstb = estimateSingle({
    taxpayerW2: { box1: 253_756.4775 },
    qbiHighIncomeDetails: { sstb: 'yes', qualifiedPropertyUbia: 100_000 },
  });
  const fullyPhasedOutSstbWithoutUbia = estimateSingle({
    taxpayerW2: { box1: 253_756.4775 },
    qbiHighIncomeDetails: { sstb: 'yes', qualifiedPropertyUbia: null },
  });
  const jointAtThreshold = estimateSingle({
    filingStatus: 'marriedJoint',
    taxpayerW2: { box1: 416_806.4775 },
  });
  const jointAboveThreshold = estimateSingle({
    filingStatus: 'marriedJoint',
    taxpayerW2: { box1: 416_807.4775 },
  });

  for (const result of [atThreshold, aboveThresholdWithoutDetails, phasedNonSstbWithoutProperty,
    phasedNonSstbWithProperty, phasedSstb, fullyPhasedOutSstb,
    fullyPhasedOutSstbWithoutUbia, jointAtThreshold, jointAboveThreshold]) {
    if (result.kind !== 'profit') {
      throw new Error('Expected a profitable high-income estimate.');
    }
  }

  if (atThreshold.kind !== 'profit' || aboveThresholdWithoutDetails.kind !== 'profit'
    || phasedNonSstbWithoutProperty.kind !== 'profit' || phasedNonSstbWithProperty.kind !== 'profit'
    || phasedSstb.kind !== 'profit' || fullyPhasedOutSstb.kind !== 'profit'
    || fullyPhasedOutSstbWithoutUbia.kind !== 'profit'
    || jointAtThreshold.kind !== 'profit' || jointAboveThreshold.kind !== 'profit') {
    throw new Error('Expected profitable estimates for the QBI boundary cases.');
  }

  assert.equal(roundToFourDecimals(atThreshold.taxableIncomeBeforeQbi), 197_300);
  assert.equal(roundToFourDecimals(atThreshold.qbiTreatment.deduction), 1_858.7045);
  assert.equal(aboveThresholdWithoutDetails.qbiTreatment.status, 'omitted');
  assert.match(aboveThresholdWithoutDetails.qbiTreatment.reason, /higher than your actual federal tax liability/i);
  assert.equal(roundToFourDecimals(phasedNonSstbWithoutProperty.qbiTreatment.deduction), 1_849.6518);
  assert.equal(roundToFourDecimals(phasedNonSstbWithProperty.qbiTreatment.deduction), 1_858.7045);
  assert.equal(roundToFourDecimals(phasedSstb.qbiTreatment.deduction), 1_849.6518);
  assert.equal(fullyPhasedOutSstb.qbiTreatment.status, 'notEligible');
  assert.equal(fullyPhasedOutSstb.qbiTreatment.deduction, 0);
  assert.equal(fullyPhasedOutSstbWithoutUbia.qbiTreatment.status, 'notEligible');
  assert.equal(fullyPhasedOutSstbWithoutUbia.qbiTreatment.deduction, 0);
  assert.equal(roundToFourDecimals(jointAtThreshold.taxableIncomeBeforeQbi), 394_600);
  assert.equal(jointAtThreshold.qbiTreatment.status, 'included');
  assert.equal(jointAboveThreshold.qbiTreatment.status, 'omitted');
});

test('applies the active federal bracket rate at a filing-status boundary', () => {
  const baseline = estimateSingle({
    grossReceipts: 0,
    taxpayerW2: { box1: 64_224.2 },
  });
  const atBracketBoundary = estimateSingle({
    grossReceipts: 1,
    taxpayerW2: { box1: 64_224.2 },
  });
  const aboveBracketBoundary = estimateSingle({
    grossReceipts: 2,
    taxpayerW2: { box1: 64_224.2 },
  });

  if (baseline.kind !== 'breakEven' || atBracketBoundary.kind !== 'profit'
    || aboveBracketBoundary.kind !== 'profit') {
    throw new Error('Expected baseline and profitable estimates at the tax bracket boundary.');
  }

  assert.equal(roundToFourDecimals(atBracketBoundary.taxableIncomeBeforeQbi), 48_475.2);
  assert.equal(roundToFourDecimals(atBracketBoundary.federalIncomeTax), 0.096);
  assert.equal(roundToFourDecimals(aboveBracketBoundary.federalIncomeTax), 0.272);
  assert.equal(
    roundToFourDecimals(aboveBracketBoundary.householdFederal.incomeTax - baseline.householdFederal.incomeTax),
    0.272,
  );
});

test('applies Social Security and Additional Medicare thresholds to business income', () => {
  const atSocialSecurityWageBase = estimateSingle({
    grossReceipts: 50_000,
    taxpayerW2: { box3: 176_100 },
  });
  const justBelowSocialSecurityWageBase = estimateSingle({
    grossReceipts: 50_000,
    taxpayerW2: { box3: 176_099 },
  });
  const atAdditionalMedicareThreshold = estimateSingle({
    grossReceipts: 50_000,
    taxpayerW2: { box5: 153_825 },
  });
  const aboveAdditionalMedicareThreshold = estimateSingle({
    grossReceipts: 50_000,
    taxpayerW2: { box5: 153_826 },
  });

  if (atSocialSecurityWageBase.kind !== 'profit' || justBelowSocialSecurityWageBase.kind !== 'profit'
    || atAdditionalMedicareThreshold.kind !== 'profit' || aboveAdditionalMedicareThreshold.kind !== 'profit') {
    throw new Error('Expected profitable estimates for payroll-tax boundary cases.');
  }

  assert.equal(roundToFourDecimals(atSocialSecurityWageBase.selfEmploymentTax), 1_339.075);
  assert.equal(
    roundToFourDecimals(justBelowSocialSecurityWageBase.selfEmploymentTax - atSocialSecurityWageBase.selfEmploymentTax),
    0.124,
  );
  assert.equal(atAdditionalMedicareThreshold.additionalMedicareTax, 0);
  assert.equal(roundToFourDecimals(aboveAdditionalMedicareThreshold.additionalMedicareTax), 0.009);
});
