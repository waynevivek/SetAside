import { ACTIVE_TAX_YEAR } from '../lib/tax/activeYear';
import { estimateTax } from '../lib/tax/estimate';
import { hasNoIndividualIncomeTax, isStateCode } from '../lib/tax/states';
import type { StateCode } from '../lib/tax/states';
import { FILING_STATUSES } from '../lib/tax/types';
import type {
  EstimateInput,
  EstimateResult,
  FilingStatus,
  HouseholdFederalEstimate,
  QbiHighIncomeDetails,
  SpouseW2Details,
  SstbAnswer,
  StateTaxTreatment,
  TaxpayerW2Details,
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
  estimatedFederalPayments: number;
  taxpayerW2: TaxpayerW2Details;
  spouseW2: SpouseW2Details;
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
  const value = input.value.trim().replaceAll(',', '');

  if (value === '') {
    return 0;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function formatGroupedNumber(value: string): string {
  const [integerPart, fractionalPart] = value.replaceAll(',', '').split('.');
  const groupedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  return fractionalPart === undefined ? groupedInteger : `${groupedInteger}.${fractionalPart}`;
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
    estimatedFederalPayments: readNumber(requiredInput('estimated-federal-payments')),
    taxpayerW2: {
      box1: readNumber(requiredInput('taxpayer-box1')),
      box2: readNumber(requiredInput('taxpayer-box2')),
      box3: readNumber(requiredInput('taxpayer-box3')),
      box4: readNumber(requiredInput('taxpayer-box4')),
      box5: readNumber(requiredInput('taxpayer-box5')),
      box6: readNumber(requiredInput('taxpayer-box6')),
    },
    spouseW2: {
      box1: readNumber(requiredInput('spouse-box1')),
      box2: readNumber(requiredInput('spouse-box2')),
      box4: readNumber(requiredInput('spouse-box4')),
      box5: readNumber(requiredInput('spouse-box5')),
      box6: readNumber(requiredInput('spouse-box6')),
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
    estimatedFederalPayments: state.estimatedFederalPayments,
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

const inputUsd = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
});

const percent = new Intl.NumberFormat('en-US', {
  style: 'percent',
  maximumFractionDigits: 0,
});

const inputPercent = new Intl.NumberFormat('en-US', {
  style: 'percent',
  maximumFractionDigits: 2,
});

function formatCurrency(amount: number): string {
  return usd.format(amount);
}

function formatInputCurrency(amount: number): string {
  return inputUsd.format(amount);
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

function updateQbiFields(result: EstimateResult, filingStatus: FilingStatus): void {
  const fields = requiredElement('qbi-fields', HTMLFieldSetElement);
  const isHighIncome = result.kind === 'profit'
    && result.taxableIncomeBeforeQbi > result.qbiThreshold;
  fields.hidden = !isHighIncome;

  const propertyField = requiredElement('qualified-property-field', HTMLLabelElement);
  if (!isHighIncome) {
    propertyField.hidden = true;
    return;
  }

  const thresholds = ACTIVE_TAX_YEAR.qbi.threshold[filingStatus];
  const sstbFullyPhasedOut = parseSstbAnswer(requiredSelect('sstb-status').value) === 'yes'
    && result.taxableIncomeBeforeQbi >= thresholds.threshold + thresholds.phaseInRange;
  propertyField.hidden = sstbFullyPhasedOut;
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
  const businessFederalTax = result.federalIncomeTax
    + result.selfEmploymentTax
    + result.additionalMedicareTax;
  const segments = [
    { id: 'expenses', value: result.businessExpenses, color: 'bg-expenses' },
    { id: 'federal-tax', value: businessFederalTax, color: 'bg-taxes' },
    { id: 'state-reserve', value: result.stateTax.amount, color: 'bg-state-reserve' },
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

  const stateReserveDescription = result.stateTax.status === 'included'
    ? `${formatCurrency(result.stateTax.amount)} state/local reserve assumption`
    : 'no state/local reserve entered';
  const description = hasCashGap
    ? `Business receipts ${formatCurrency(result.grossReceipts)}. Expenses, business-attributable federal taxes, and ${stateReserveDescription} total ${formatCurrency(totalShown)}, exceeding receipts by ${formatCurrency(Math.abs(result.takeHomeAnnual))}.`
    : `Business receipts of ${formatCurrency(result.grossReceipts)} split into ${formatCurrency(result.businessExpenses)} expenses, ${formatCurrency(businessFederalTax)} federal taxes attributable to the business, ${stateReserveDescription}, and ${formatCurrency(result.takeHomeAnnual)} take-home.`;
  bar.setAttribute('aria-label', description);
  setText('breakdown-expenses', formatCurrency(result.businessExpenses));
  setText('breakdown-federal-tax', formatCurrency(businessFederalTax));
  setText('breakdown-state-reserve', formatCurrency(result.stateTax.amount));
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

function getFederalBalanceLabel(balance: HouseholdFederalEstimate['balance']): string {
  if (balance.kind === 'amountDue') {
    return 'Estimated federal amount due';
  }

  if (balance.kind === 'estimatedOverpayment') {
    return 'Estimated overpayment';
  }

  return 'No remaining federal balance';
}

function getFederalBalanceNote(balance: HouseholdFederalEstimate['balance']): string {
  if (balance.kind === 'estimatedOverpayment') {
    return 'This is an estimated overpayment, not a promised refund. An actual refund depends on your complete tax return and other adjustments.';
  }

  if (balance.kind === 'amountDue') {
    return 'After W-2 federal income tax withholding, eligible wage-tax credits, and estimated federal payments.';
  }

  return 'W-2 withholding, eligible wage-tax credits, and estimated payments match the modeled liability.';
}

function renderHouseholdFederal(estimate: HouseholdFederalEstimate): void {
  setText('household-federal-liability', formatCurrency(estimate.liability));
  setText(
    'household-federal-withholding',
    formatCurrency(estimate.payments.federalIncomeTaxWithholding),
  );
  setText(
    'household-estimated-payments',
    formatCurrency(estimate.payments.estimatedFederalPayments),
  );
  setText(
    'household-excess-social-security',
    formatCurrency(estimate.payments.excessSocialSecurityWithholding),
  );
  setText(
    'household-additional-medicare-withholding',
    formatCurrency(estimate.payments.additionalMedicareTaxWithholding),
  );
  setText('household-federal-balance-label', getFederalBalanceLabel(estimate.balance));
  setText('household-federal-balance', formatCurrency(estimate.balance.amount));
  setText('household-federal-balance-note', getFederalBalanceNote(estimate.balance));
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
  renderHouseholdFederal(result.householdFederal);

  if (result.kind === 'profit') {
    renderProfit(result, invoiceAmount);
    return;
  }

  if (result.kind === 'loss') {
    setText('loss-amount', formatCurrency(result.cashDeficit));
    setText('profit-status-note', `Business loss of ${formatCurrency(result.businessLoss)}. The household federal estimate below does not apply the loss.`);
    return;
  }

  setText('break-even-business-profit', formatCurrency(result.businessProfit));
  setText('break-even-take-home-annual', formatCurrency(result.takeHomeAnnual));
  setText('break-even-take-home-monthly', formatCurrency(result.takeHomeMonthly));
  setText('break-even-reserve-rate', percent.format(result.reserveRate));
  setText(
    'break-even-invoice-reserve',
    formatCurrency(Math.ceil(invoiceAmount * result.reservePercent / 100)),
  );
  setText('break-even-invoice-context', `for a ${formatCurrency(invoiceAmount)} invoice`);
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
  const receiptsInput = state.revenuePeriod === 'monthly'
    ? `Average monthly gross receipts entered: ${formatInputCurrency(state.grossRevenue)}`
    : `Annual gross receipts entered: ${formatInputCurrency(state.grossRevenue)}`;
  const expensesInput = state.expenseMode === 'percent'
    ? `Business expenses entered: ${inputPercent.format(state.expenseValue / 100)} of receipts (${formatInputCurrency(input.businessExpenses)} annual)`
    : `Annual business expenses entered: ${formatInputCurrency(state.expenseValue)}`;
  const stateName = state.stateCode === null ? 'not selected' : state.stateCode;
  const stateReserveInput = state.stateReserveRate === null
    ? 'not entered'
    : `${inputPercent.format(state.stateReserveRate)} (user assumption)`;
  const lines = [
    `SetAside · ${ACTIVE_TAX_YEAR.year} tax estimate`,
    'Scenario inputs',
    `Filing status: ${getFilingStatusLabel(state.filingStatus)}`,
    receiptsInput,
    `Annualized gross receipts used: ${formatInputCurrency(input.grossReceipts)}`,
    expensesInput,
    formatW2Inputs('Taxpayer W-2 totals', state.taxpayerW2),
    ...(state.filingStatus === 'marriedJoint'
      ? [formatW2Inputs('Spouse W-2 totals', state.spouseW2)]
      : []),
    `Estimated federal payments entered: ${formatInputCurrency(state.estimatedFederalPayments)}`,
    `State: ${stateName}`,
    `State/local reserve input: ${stateReserveInput}`,
    `Invoice amount: ${formatInputCurrency(state.invoiceAmount)}`,
    ...(result.kind === 'profit' && result.taxableIncomeBeforeQbi > result.qbiThreshold
      ? [`High-income QBI inputs: specified-service trade ${state.qbiHighIncomeDetails.sstb}; qualified property basis ${state.qbiHighIncomeDetails.qualifiedPropertyUbia === null ? 'not entered' : formatInputCurrency(state.qbiHighIncomeDetails.qualifiedPropertyUbia)}`]
      : []),
    'Household federal estimate',
    `Household federal liability before payments: ${formatCurrency(result.householdFederal.liability)}`,
    `W-2 federal income tax withheld: ${formatCurrency(result.householdFederal.payments.federalIncomeTaxWithholding)}`,
    `Estimated federal payments: ${formatCurrency(result.householdFederal.payments.estimatedFederalPayments)}`,
    `Eligible excess Social Security withholding: ${formatCurrency(result.householdFederal.payments.excessSocialSecurityWithholding)}`,
    `Additional Medicare Tax withheld: ${formatCurrency(result.householdFederal.payments.additionalMedicareTaxWithholding)}`,
    `Total modeled federal payments: ${formatCurrency(result.householdFederal.payments.total)}`,
    `${getFederalBalanceLabel(result.householdFederal.balance)}: ${formatCurrency(result.householdFederal.balance.amount)}`,
  ];

  if (result.kind === 'loss') {
    lines.push('Business result');
    lines.push(`Business loss / cash deficit: ${formatCurrency(result.cashDeficit)}`);
    lines.push('The loss is not applied to federal taxable income. The W-2-based household estimate may be higher than actual liability if the loss is deductible; business take-home and reserve are not calculated.');
  } else if (result.kind === 'breakEven') {
    lines.push('Business result');
    lines.push(`Annual business profit: ${formatCurrency(result.businessProfit)}`);
    lines.push(`Annual business take-home: ${formatCurrency(result.takeHomeAnnual)}`);
    lines.push(`Monthly business take-home: ${formatCurrency(result.takeHomeMonthly)}`);
    lines.push(`Business tax and reserve: ${formatCurrency(result.totalEstimatedTax)}`);
    lines.push(`Invoice reserve rate: ${result.reservePercent}%`);
    lines.push(`Reserve for a ${formatInputCurrency(state.invoiceAmount)} invoice: ${formatCurrency(Math.ceil(state.invoiceAmount * result.reservePercent / 100))}`);
  } else {
    lines.push('Business result');
    lines.push(`Annual business profit: ${formatCurrency(result.businessProfit)}`);
    lines.push(`Federal income tax on business: ${formatCurrency(result.federalIncomeTax)}`);
    lines.push(`Self-employment tax: ${formatCurrency(result.selfEmploymentTax)}`);
    lines.push(`Additional Medicare tax: ${formatCurrency(result.additionalMedicareTax)}`);
    lines.push(`State/local reserve assumption: ${result.stateTax.status === 'included' ? formatCurrency(result.stateTax.amount) : 'not included'}`);
    lines.push(`Total business tax and reserve: ${formatCurrency(result.totalEstimatedTax)}`);
    lines.push(`Estimated annual take-home: ${formatCurrency(result.takeHomeAnnual)}`);
    lines.push(`Estimated monthly take-home: ${formatCurrency(result.takeHomeMonthly)}`);
    lines.push(`Suggested invoice reserve rate: ${result.reservePercent}%`);
    lines.push(`Reserve for a ${formatInputCurrency(state.invoiceAmount)} invoice: ${formatCurrency(Math.ceil(state.invoiceAmount * result.reservePercent / 100))}`);
    lines.push(`QBI: ${result.qbiTreatment.status === 'included' ? `${formatCurrency(result.qbiTreatment.deduction)} deduction` : result.qbiTreatment.reason}`);
  }

  lines.push(`Assumptions and limits: ${ACTIVE_TAX_YEAR.year} federal rules; one U.S. sole-proprietor business; standard deduction; excludes itemized deductions and other tax credits; state/local reserve is a user input, not a calculated state tax; business losses are not applied to federal income.`);
  lines.push('Planning estimate only. Not tax advice or a tax return.');

  return lines.join('\n');
}

function formatW2Inputs(label: string, w2: TaxpayerW2Details | SpouseW2Details): string {
  const boxes = [
    `Box 1 ${formatInputCurrency(w2.box1)}`,
    `Box 2 ${formatInputCurrency(w2.box2)}`,
  ];

  if ('box3' in w2) {
    boxes.push(`Box 3 ${formatInputCurrency(w2.box3)}`);
  }

  boxes.push(
    `Box 4 ${formatInputCurrency(w2.box4)}`,
    `Box 5 ${formatInputCurrency(w2.box5)}`,
    `Box 6 ${formatInputCurrency(w2.box6)}`,
  );

  return `${label}: ${boxes.join(', ')}`;
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
    updateQbiFields(latestResult, latestFormState.filingStatus);
    renderResult(latestResult, latestFormState.invoiceAmount);
    setText('copy-status', '');
  };

  revenueInput.addEventListener('blur', () => {
    const value = revenueInput.value.trim().replaceAll(',', '');
    const amount = Number(value);

    if (value !== '' && Number.isFinite(amount) && amount >= 0) {
      revenueInput.value = formatGroupedNumber(value);
    }
  });

  revenueRange.addEventListener('input', () => {
    revenueInput.value = formatGroupedNumber(revenueRange.value);
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
      revenueInput.value = formatGroupedNumber(String(Number(convertedValue.toFixed(2))));

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
