import { ACTIVE_TAX_YEAR } from './activeYear';
import type { FilingStatus, QbiHighIncomeDetails, QbiTreatment } from './types';

export interface QbiInput {
  filingStatus: FilingStatus;
  qualifiedBusinessIncome: number;
  taxableIncomeBeforeQbi: number;
  highIncomeDetails?: QbiHighIncomeDetails;
}

export function calculateQbiDeduction(input: QbiInput): QbiTreatment {
  const qbi = Math.max(0, input.qualifiedBusinessIncome);

  if (qbi === 0) {
    return {
      status: 'notEligible',
      deduction: 0,
      reason: 'No positive qualified business income is available for this estimate.',
    };
  }

  const thresholds = ACTIVE_TAX_YEAR.qbi.threshold[input.filingStatus];
  const taxableIncome = Math.max(0, input.taxableIncomeBeforeQbi);
  const limit = Math.max(0, taxableIncome) * ACTIVE_TAX_YEAR.qbi.deductionRate;
  let eligibleQbi = qbi;
  let eligibleUbia = 0;
  let minimumApplies = qbi >= ACTIVE_TAX_YEAR.qbi.minimumQbi;

  if (taxableIncome > thresholds.threshold) {
    const details = input.highIncomeDetails;

    if (details === undefined || details.sstb === 'unsure') {
      return {
        status: 'omitted',
        deduction: 0,
        reason: 'QBI is omitted because the higher-income service-trade or qualified-property details are incomplete. The estimate may be higher than your actual federal tax liability.',
      };
    }

    const phaseIn = Math.min(
      1,
      (taxableIncome - thresholds.threshold) / thresholds.phaseInRange,
    );

    if (details.sstb === 'yes') {
      const eligiblePercentage = 1 - phaseIn;

      if (eligiblePercentage <= 0) {
        return {
          status: 'notEligible',
          deduction: 0,
          reason: `This specified-service business is outside the ${ACTIVE_TAX_YEAR.year} QBI income range.`,
        };
      }

      eligibleQbi *= eligiblePercentage;
      minimumApplies = eligibleQbi >= ACTIVE_TAX_YEAR.qbi.minimumQbi;
    }

    if (details.qualifiedPropertyUbia === null) {
      return {
        status: 'omitted',
        deduction: 0,
        reason: 'QBI is omitted because the higher-income qualified-property basis is incomplete. The estimate may be higher than your actual federal tax liability.',
      };
    }

    eligibleUbia = Math.max(0, details.qualifiedPropertyUbia);

    if (details.sstb === 'yes') {
      eligibleUbia *= 1 - phaseIn;
    }
  }

  const basicQbiComponent = eligibleQbi * ACTIVE_TAX_YEAR.qbi.deductionRate;
  const wageAndPropertyLimit = eligibleUbia * 0.025;
  const phaseIn = taxableIncome > thresholds.threshold
    ? Math.min(1, (taxableIncome - thresholds.threshold) / thresholds.phaseInRange)
    : 0;
  const phasedReduction = Math.max(0, basicQbiComponent - wageAndPropertyLimit) * phaseIn;
  const qbiComponent = Math.max(0, basicQbiComponent - phasedReduction);
  const limitedDeduction = Math.min(qbiComponent, limit);
  const minimumDeduction = minimumApplies ? ACTIVE_TAX_YEAR.qbi.minimumDeduction : 0;
  const deduction = Math.max(limitedDeduction, minimumDeduction);

  return {
    status: 'included',
    deduction,
    reason: 'Assumes one eligible U.S. sole-proprietor business; no employee wages, prior-year QBI losses, or other QBI items are modeled.',
  };
}
