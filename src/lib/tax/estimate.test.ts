import assert from 'node:assert/strict';
import test from 'node:test';
import { estimateTax } from './estimate';
import { FILING_STATUSES } from './types';
import type { FilingStatus } from './types';

function roundToFourDecimals(value: number): number {
  return Math.round(value * 10_000) / 10_000;
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
});
