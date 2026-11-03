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
      otherTaxableIncome: 0,
      taxpayerW2: { box1: 0, box3: 0, box5: 0 },
      spouseW2: { box1: 0, box5: 0 },
      stateCode: null,
      stateReserveRate: 0,
    });

    if (result.kind !== 'profit') {
      throw new Error(`Expected a profit estimate for ${filingStatus}.`);
    }

    assert.equal(roundToFourDecimals(result.selfEmploymentTax), 7_064.775);
    assert.equal(roundToFourDecimals(result.taxableIncomeBeforeQbi), expected.taxableIncomeBeforeQbi);
    assert.equal(roundToFourDecimals(result.federalIncomeTax), expected.federalIncomeTax);
  }
});
