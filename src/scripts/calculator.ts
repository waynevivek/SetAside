import { estimateTax } from '../lib/tax/estimate';
import { hasNoIndividualIncomeTax, isStateCode } from '../lib/tax/states';
import type { StateCode } from '../lib/tax/states';
import { FILING_STATUSES } from '../lib/tax/types';
import type {
  EstimateInput,
  EstimateResult,
  FilingStatus,
  QbiHighIncomeDetails,
  SstbAnswer,
  StateTaxTreatment,
} from '../lib/tax/types';

type RevenuePeriod = 'annual' | 'monthly';
type ExpenseMode = 'percent' | 'flat';

interface CalculatorFormState {
  revenuePeriod: RevenuePeriod;
  grossRevenue: number;
  expenseMode: ExpenseMode;
  expenseValue: number;
  filingStatus: FilingStatus;
  stateCode: StateCode | null;
  stateReserveRate: number | null;
  otherTaxableIncome: number;
  taxpayerW2: { box1: number; box3: number; box5: number };
  spouseW2: { box1: number; box5: number };
  qbiHighIncomeDetails: QbiHighIncomeDetails;
  invoiceAmount: number;
}

function requiredElement<T extends Element>(id: string, type: { new (): T }): T {
  const element = document.getElementById(id);

  if (!(element instanceof type)) {
    throw new Error(`Expected #${id} to exist in the calculator page.`);
  }

  return element;
}

function requiredInput(id: string): HTMLInputElement {
  return requiredElement(id, HTMLInputElement);
}

function requiredSelect(id: string): HTMLSelectElement {
  return requiredElement(id, HTMLSelectElement);
}

function readNumber(input: HTMLInputElement): number {
  const value = input.value.trim();

  if (value === '') {
    return 0;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function readOptionalRate(input: HTMLInputElement): number | null {
  const value = input.value.trim();

  if (value === '') {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.min(parsed, 100) / 100 : null;
}

function parseFilingStatus(value: string): FilingStatus {
  return FILING_STATUSES.find((status) => status === value) ?? 'single';
}

function parseSstbAnswer(value: string): SstbAnswer {
  if (value === 'yes' || value === 'no') {
    return value;
  }

  return 'unsure';
}

function readCalculatorFormState(): CalculatorFormState {
  const stateValue = requiredSelect('state-code').value;
  const ubiaInput = requiredInput('qualified-property-ubia');
  const ubiaValue = ubiaInput.value.trim();
  const ubia = ubiaValue === '' ? null : readNumber(ubiaInput);

  return {
    revenuePeriod: document.querySelector<HTMLButtonElement>('[data-revenue-period="monthly"]')?.getAttribute('aria-pressed') === 'true'
      ? 'monthly'
      : 'annual',
    grossRevenue: readNumber(requiredInput('gross-revenue-number')),
    expenseMode: document.querySelector<HTMLButtonElement>('[data-expense-mode="flat"]')?.getAttribute('aria-pressed') === 'true'
      ? 'flat'
      : 'percent',
    expenseValue: readNumber(requiredInput(
      document.querySelector<HTMLButtonElement>('[data-expense-mode="flat"]')?.getAttribute('aria-pressed') === 'true'
        ? 'expense-flat-number'
        : 'expense-percent-number',
    )),
    filingStatus: parseFilingStatus(requiredSelect('filing-status').value),
    stateCode: isStateCode(stateValue) ? stateValue : null,
    stateReserveRate: readOptionalRate(requiredInput('state-reserve-rate')),
    otherTaxableIncome: readNumber(requiredInput('other-taxable-income')),
    taxpayerW2: {
      box1: readNumber(requiredInput('taxpayer-box1')),
      box3: readNumber(requiredInput('taxpayer-box3')),
      box5: readNumber(requiredInput('taxpayer-box5')),
    },
    spouseW2: {
      box1: readNumber(requiredInput('spouse-box1')),
      box5: readNumber(requiredInput('spouse-box5')),
    },
    qbiHighIncomeDetails: {
      sstb: parseSstbAnswer(requiredSelect('sstb-status').value),
      qualifiedPropertyUbia: ubia,
    },
    invoiceAmount: readNumber(requiredInput('invoice-amount')),
  };
}

function normalizeCalculatorForm(state: CalculatorFormState): EstimateInput {
  const grossReceipts = state.revenuePeriod === 'monthly'
    ? state.grossRevenue * 12
    : state.grossRevenue;
  const businessExpenses = state.expenseMode === 'percent'
    ? grossReceipts * Math.min(100, state.expenseValue) / 100
    : state.expenseValue;

  return {
    filingStatus: state.filingStatus,
    grossReceipts,
    businessExpenses,
    otherTaxableIncome: state.otherTaxableIncome,
    taxpayerW2: state.taxpayerW2,
    spouseW2: state.spouseW2,
    stateCode: state.stateCode,
    stateReserveRate: state.stateReserveRate,
    qbiHighIncomeDetails: state.qbiHighIncomeDetails,
  };
}

const usd = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

const percent = new Intl.NumberFormat('en-US', {
  style: 'percent',
  maximumFractionDigits: 0,
});

function formatCurrency(amount: number): string {
  return usd.format(amount);
}

function setRangeMaximum(
  range: HTMLInputElement,
  amount: number,
  initialMaximum: number,
  increment: number,
): void {
  const maximum = amount <= initialMaximum
    ? initialMaximum
    : Math.ceil(amount / increment) * increment;

  range.max = String(maximum);
  range.value = String(Math.min(amount, maximum));
}

function updateRevenueControls(): void {
  const isMonthly = document.querySelector<HTMLButtonElement>('[data-revenue-period="monthly"]')?.getAttribute('aria-pressed') === 'true';
  const input = requiredInput('gross-revenue-number');
  const range = requiredInput('gross-revenue-range');
  const label = requiredElement('revenue-label', HTMLSpanElement);
  const maxLabel = requiredElement('gross-range-max-label', HTMLSpanElement);
  const step = isMonthly ? 5_000 : 50_000;
  const initialMaximum = isMonthly ? 25_000 : 300_000;

  label.textContent = isMonthly ? 'Average monthly gross revenue' : 'Annual gross revenue';
  range.setAttribute('aria-label', isMonthly ? 'Adjust average monthly gross revenue' : 'Adjust annual gross revenue');
  setRangeMaximum(range, readNumber(input), initialMaximum, step);
  maxLabel.textContent = formatCurrency(Number(range.max));
}

function updateExpenseControls(): void {
  const isFlat = document.querySelector<HTMLButtonElement>('[data-expense-mode="flat"]')?.getAttribute('aria-pressed') === 'true';
  const percentageInput = requiredInput('expense-percent-number');
  const percentageValue = Number(percentageInput.value);
  const percentField = requiredElement('expense-percent-field', HTMLLabelElement);
  const flatField = requiredElement('expense-flat-field', HTMLLabelElement);
  const percentSlider = requiredElement('expense-percent-slider', HTMLDivElement);
  const flatSlider = requiredElement('expense-flat-slider', HTMLDivElement);
  if (percentageInput.value.trim() !== '' && Number.isFinite(percentageValue) && percentageValue > 100) {
    percentageInput.value = '100';
  }
  percentField.hidden = isFlat;
  percentSlider.hidden = isFlat;
  flatField.hidden = !isFlat;
  flatSlider.hidden = !isFlat;

  const expenseRange = requiredInput('expense-flat-range');
  setRangeMaximum(expenseRange, readNumber(requiredInput('expense-flat-number')), 300_000, 50_000);
  requiredElement('expense-range-max-label', HTMLSpanElement).textContent = formatCurrency(Number(expenseRange.max));
}

function updateSpouseFields(filingStatus: FilingStatus): void {
  requiredElement('spouse-wages-fields', HTMLDivElement).hidden = filingStatus !== 'marriedJoint';
}

function updateQbiFields(result: EstimateResult): void {
  const fields = requiredElement('qbi-fields', HTMLFieldSetElement);
  fields.hidden = result.kind !== 'profit' || result.taxableIncomeBeforeQbi <= result.qbiThreshold;
}

function setText(id: string, value: string): void {
  requiredElement(id, HTMLElement).textContent = value;
}

function setBreakdown(result: Extract<EstimateResult, { kind: 'profit' }>): void {
  const bar = requiredElement('breakdown-bar', HTMLDivElement);
  const hasCashGap = result.takeHomeAnnual < 0;
  const totalShown = hasCashGap
    ? result.businessExpenses + result.totalEstimatedTax
    : result.grossReceipts;
  const segments = [
    { id: 'expenses', value: result.businessExpenses, color: 'bg-expenses' },
    { id: 'taxes', value: result.totalEstimatedTax, color: 'bg-taxes' },
    { id: 'net', value: Math.max(0, result.takeHomeAnnual), color: 'bg-net' },
  ];
  bar.replaceChildren();

  for (const segment of segments) {
    if (segment.value <= 0 || totalShown <= 0) {
      continue;
    }

    const part = document.createElement('div');
    part.className = `breakdown-segment ${segment.color}`;
    part.style.width = `${(segment.value / totalShown) * 100}%`;
    part.setAttribute('aria-hidden', 'true');
    bar.append(part);
  }

  const description = hasCashGap
    ? `Business receipts ${formatCurrency(result.grossReceipts)}. Expenses and included estimated taxes total ${formatCurrency(totalShown)}, exceeding receipts by ${formatCurrency(Math.abs(result.takeHomeAnnual))}.`
    : `Business receipts of ${formatCurrency(result.grossReceipts)} split into ${formatCurrency(result.businessExpenses)} expenses, ${formatCurrency(result.totalEstimatedTax)} estimated taxes, and ${formatCurrency(result.takeHomeAnnual)} take-home.`;
  bar.setAttribute('aria-label', description);
  setText('breakdown-expenses', formatCurrency(result.businessExpenses));
  setText('breakdown-taxes', formatCurrency(result.totalEstimatedTax));
  setText('breakdown-net', formatCurrency(result.takeHomeAnnual));
  requiredElement('breakdown-gap-row', HTMLLIElement).hidden = !hasCashGap;
  setText('breakdown-gap', formatCurrency(Math.abs(result.takeHomeAnnual)));
}

function getStateTaxNote(treatment: StateTaxTreatment): string {
  if (treatment.status === 'omitted') {
    return 'State and local income taxes are not included. Add your own reserve percentage if you want it reflected.';
  }

  if (treatment.rate === 0) {
    return 'State income tax is included at 0% based on your selection. Local and business taxes are not modeled.';
  }

  return `Uses your ${percent.format(treatment.rate)} state/local reserve assumption on business profit; this is not a calculated state tax bill.`;
}

function getQbiNote(result: Extract<EstimateResult, { kind: 'profit' }>): string {
  if (result.qbiTreatment.status === 'included') {
    return `Includes an estimated ${formatCurrency(result.qbiTreatment.deduction)} QBI deduction. ${result.qbiTreatment.reason} `;
  }

  return result.qbiTreatment.reason;
}

function renderProfit(result: Extract<EstimateResult, { kind: 'profit' }>, invoiceAmount: number): void {
  setText('take-home-annual', formatCurrency(result.takeHomeAnnual));
  setText('take-home-monthly', formatCurrency(result.takeHomeMonthly));
  setText('business-profit', formatCurrency(result.businessProfit));
  setText('reserve-recommendation', `Save ${result.reservePercent}% of each invoice`);
  setText('invoice-reserve-amount', formatCurrency(Math.ceil(invoiceAmount * result.reservePercent / 100)));
  setText('federal-tax-amount', formatCurrency(result.federalIncomeTax));
  setText('se-tax-amount', formatCurrency(result.selfEmploymentTax));
  setText('additional-medicare-amount', formatCurrency(result.additionalMedicareTax));
  setText('state-tax-amount', result.stateTax.status === 'included'
    ? formatCurrency(result.stateTax.amount)
    : 'Not included');
  setText('state-result-note', getStateTaxNote(result.stateTax));
  setText('qbi-result-note', getQbiNote(result));
  setText('total-tax-amount', formatCurrency(result.totalEstimatedTax));
  setBreakdown(result);
  setText('profit-status-note', result.takeHomeAnnual >= 0
    ? `Estimated annual take-home ${formatCurrency(result.takeHomeAnnual)}.`
    : `Estimated tax reserves exceed business profit by ${formatCurrency(Math.abs(result.takeHomeAnnual))}.`);
}

function renderResult(result: EstimateResult, invoiceAmount: number): void {
  const profitResults = requiredElement('profit-results', HTMLDivElement);
  const breakEvenResults = requiredElement('break-even-results', HTMLDivElement);
  const lossResults = requiredElement('loss-results', HTMLDivElement);
  profitResults.hidden = result.kind !== 'profit';
  breakEvenResults.hidden = result.kind !== 'breakEven';
  lossResults.hidden = result.kind !== 'loss';

  if (result.kind === 'profit') {
    renderProfit(result, invoiceAmount);
    return;
  }

  if (result.kind === 'loss') {
    setText('loss-amount', formatCurrency(result.cashDeficit));
    setText('profit-status-note', `Business loss of ${formatCurrency(result.businessLoss)}. Tax and take-home estimate unavailable.`);
    return;
  }

  setText('profit-status-note', 'Break-even. No positive business profit is available for a tax reserve or take-home estimate.');
}

function getFilingStatusLabel(status: FilingStatus): string {
  const labels: Record<FilingStatus, string> = {
    single: 'Single',
    marriedJoint: 'Married filing jointly',
    marriedSeparate: 'Married filing separately',
    headOfHousehold: 'Head of household',
    qualifyingSurvivingSpouse: 'Qualifying surviving spouse',
  };

  return labels[status];
}

function buildCalculationSummary(
  state: CalculatorFormState,
  result: EstimateResult,
): string {
  const input = normalizeCalculatorForm(state);
  const lines = [
    'SetAside · 2026 tax estimate',
    `Filing status: ${getFilingStatusLabel(state.filingStatus)}`,
    `Gross receipts: ${formatCurrency(input.grossReceipts)}`,
    `Business expenses: ${formatCurrency(input.businessExpenses)}`,
  ];

  if (result.kind === 'loss') {
    lines.push(`Business loss / cash deficit: ${formatCurrency(result.cashDeficit)}`);
    lines.push('Tax and take-home estimates are unavailable for a business loss.');
  } else if (result.kind === 'breakEven') {
    lines.push('Business profit: $0');
    lines.push('Estimated taxes and take-home: $0 at break-even.');
  } else {
    lines.push(`Federal income tax on business: ${formatCurrency(result.federalIncomeTax)}`);
    lines.push(`Self-employment tax: ${formatCurrency(result.selfEmploymentTax)}`);
    lines.push(`Additional Medicare tax: ${formatCurrency(result.additionalMedicareTax)}`);
    lines.push(`State/local reserve: ${result.stateTax.status === 'included' ? formatCurrency(result.stateTax.amount) : 'not included'}`);
    lines.push(`Estimated annual take-home: ${formatCurrency(result.takeHomeAnnual)}`);
    lines.push(`Estimated monthly take-home: ${formatCurrency(result.takeHomeMonthly)}`);
    lines.push(`Suggested reserve: ${result.reservePercent}% of each invoice`);
    lines.push(`Reserve for a ${formatCurrency(state.invoiceAmount)} invoice: ${formatCurrency(Math.ceil(state.invoiceAmount * result.reservePercent / 100))}`);
    lines.push(`QBI: ${result.qbiTreatment.status === 'included' ? `${formatCurrency(result.qbiTreatment.deduction)} deduction` : result.qbiTreatment.reason}`);
  }

  const stateName = state.stateCode === null ? 'not selected' : state.stateCode;
  lines.push(`State: ${stateName}`);
  lines.push('Assumptions: 2026 federal rules; one U.S. sole-proprietor business; standard deduction; no credits, itemized deductions, or estimated payments. State tax is included only if a reserve rate was entered.');
  lines.push('Planning estimate only. Not tax advice or a tax return.');

  return lines.join('\n');
}

function updateThemeButton(theme: 'dark' | 'light'): void {
  const button = requiredElement('theme-toggle', HTMLButtonElement);
  const sunIcon = requiredElement('theme-sun-icon', SVGElement);
  const moonIcon = requiredElement('theme-moon-icon', SVGElement);
  const isDark = theme === 'dark';
  button.setAttribute('aria-label', isDark ? 'Switch to light theme' : 'Switch to dark theme');
  button.setAttribute('aria-pressed', String(isDark));
  sunIcon.classList.toggle('hidden', isDark);
  moonIcon.classList.toggle('hidden', !isDark);
}

function initializeTheme(): void {
  const root = document.documentElement;
  let userOverride: 'dark' | 'light' | null = null;
  const preference = window.matchMedia('(prefers-color-scheme: dark)');
  const applyTheme = (theme: 'dark' | 'light') => {
    root.dataset.theme = theme;
    updateThemeButton(theme);
  };

  applyTheme(preference.matches ? 'dark' : 'light');
  preference.addEventListener('change', () => {
    if (userOverride === null) {
      applyTheme(preference.matches ? 'dark' : 'light');
    }
  });

  requiredElement('theme-toggle', HTMLButtonElement).addEventListener('click', () => {
    userOverride = root.dataset.theme === 'dark' ? 'light' : 'dark';
    applyTheme(userOverride);
  });
}

function initializeCalculator(): void {
  const form = requiredElement('tax-form', HTMLFormElement);
  const revenueInput = requiredInput('gross-revenue-number');
  const revenueRange = requiredInput('gross-revenue-range');
  const expensePercentInput = requiredInput('expense-percent-number');
  const expensePercentRange = requiredInput('expense-percent-range');
  const expenseFlatInput = requiredInput('expense-flat-number');
  const expenseFlatRange = requiredInput('expense-flat-range');
  let latestFormState = readCalculatorFormState();
  let latestResult: EstimateResult = estimateTax(normalizeCalculatorForm(latestFormState));

  const update = () => {
    const stateRateInput = requiredInput('state-reserve-rate');
    const stateRateValue = Number(stateRateInput.value);
    if (stateRateInput.value.trim() !== '' && Number.isFinite(stateRateValue) && stateRateValue > 100) {
      stateRateInput.value = '100';
    }
    updateRevenueControls();
    updateExpenseControls();
    latestFormState = readCalculatorFormState();
    latestResult = estimateTax(normalizeCalculatorForm(latestFormState));
    updateSpouseFields(latestFormState.filingStatus);
    updateQbiFields(latestResult);
    renderResult(latestResult, latestFormState.invoiceAmount);
    setText('copy-status', '');
  };

  revenueRange.addEventListener('input', () => {
    revenueInput.value = revenueRange.value;
  });
  expensePercentRange.addEventListener('input', () => {
    expensePercentInput.value = expensePercentRange.value;
  });
  expenseFlatRange.addEventListener('input', () => {
    expenseFlatInput.value = expenseFlatRange.value;
  });
  form.addEventListener('input', update);
  form.addEventListener('change', update);
  form.addEventListener('submit', (event) => event.preventDefault());

  for (const button of document.querySelectorAll<HTMLButtonElement>('[data-revenue-period]')) {
    button.addEventListener('click', () => {
      const nextPeriod = button.dataset.revenuePeriod;
      const currentIsMonthly = document.querySelector<HTMLButtonElement>('[data-revenue-period="monthly"]')?.getAttribute('aria-pressed') === 'true';

      if ((nextPeriod === 'monthly') === currentIsMonthly) {
        return;
      }

      const currentValue = readNumber(revenueInput);
      const convertedValue = nextPeriod === 'monthly' ? currentValue / 12 : currentValue * 12;
      revenueInput.value = String(Number(convertedValue.toFixed(2)));

      for (const periodButton of document.querySelectorAll<HTMLButtonElement>('[data-revenue-period]')) {
        const selected = periodButton === button;
        periodButton.classList.toggle('is-selected', selected);
        periodButton.setAttribute('aria-pressed', String(selected));
      }

      update();
    });
  }

  for (const button of document.querySelectorAll<HTMLButtonElement>('[data-expense-mode]')) {
    button.addEventListener('click', () => {
      for (const modeButton of document.querySelectorAll<HTMLButtonElement>('[data-expense-mode]')) {
        const selected = modeButton === button;
        modeButton.classList.toggle('is-selected', selected);
        modeButton.setAttribute('aria-pressed', String(selected));
      }

      update();
    });
  }

  const stateSelect = requiredSelect('state-code');
  const stateRateInput = requiredInput('state-reserve-rate');
  stateSelect.addEventListener('change', () => {
    const selectedState = stateSelect.value;
    const wasAutomaticZero = stateRateInput.dataset.automaticZero === 'true';
    const hasCustomRate = stateRateInput.value.trim() !== '' && !wasAutomaticZero;

    if (isStateCode(selectedState) && hasNoIndividualIncomeTax(selectedState)) {
      if (!hasCustomRate) {
        stateRateInput.value = '0';
        stateRateInput.dataset.automaticZero = 'true';
      }
    } else if (wasAutomaticZero) {
      stateRateInput.value = '';
      stateRateInput.dataset.automaticZero = 'false';
    }
  });
  stateRateInput.addEventListener('input', () => {
    stateRateInput.dataset.automaticZero = 'false';
  });

  requiredElement('copy-summary', HTMLButtonElement).addEventListener('click', async () => {
    const status = requiredElement('copy-status', HTMLParagraphElement);

    try {
      await navigator.clipboard.writeText(buildCalculationSummary(latestFormState, latestResult));
      status.textContent = 'Calculation summary copied.';
    } catch {
      status.textContent = 'Clipboard access is unavailable in this browser.';
    }
  });

  initializeTheme();
  update();
}

initializeCalculator();
