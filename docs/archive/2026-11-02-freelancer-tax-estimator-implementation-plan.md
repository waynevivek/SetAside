# Historical Freelancer & Creator Tax Estimator Plan (Superseded)

> **Status: historical only.** This plan predates the completed Grill with Docs phase and is not an active implementation plan. Its checklist and older product assumptions are superseded by the [current product specification](../specs/2026-11-03-setaside-tax-estimator.md), `CONTEXT.md`, and ADRs 0001–0020. Do not execute tasks or create issues from this file.

The active workflow is Ask Matt and phase boundaries → Grill with Docs → Domain Modeling → To Spec → To Tickets → Implement → Code Review. The specification must be reviewed and approved before To Tickets creates implementation issues. After approval, derive work from the existing application and preserve it; do not rebuild the project. Superpowers is not part of this repository workflow.

**Goal:** Build a private, fast U.S. tax and cash-planning estimator for solo freelancers and creators.

**Architecture:** Astro produces static HTML with Tailwind styling. Plain browser TypeScript normalizes form input, performs pure tax calculations, updates the results, and handles theme and clipboard interactions. Federal tax-year data is versioned; state tax is an optional user assumption rather than a state tax engine.

**Tech Stack:** Astro, TypeScript, Tailwind CSS, Cloudflare Pages.

**Current specification:** `docs/specs/2026-11-03-setaside-tax-estimator.md`

## Global Constraints

- Static Astro multi-page output; no server-side calculator or backend endpoint.
- Plain client-side TypeScript; no React, Preact, or other UI runtime.
- Financial inputs stay in memory and never enter network requests, analytics, cookies, or persistent browser storage.
- Support the five federal filing statuses and a single domestic sole-proprietor business.
- Use the latest tax year whose official data has been verified at release; use 2026 if releasing against verified 2026 data.
- Do not prefill state-income-tax rates for states that tax personal income; use a user-entered state/local reserve percentage.
- Apply QBI only within the single-business scope in the design spec; disclose when required inputs are missing.
- Preview hosts receive `X-Robots-Tag: noindex`; production remains indexable.
- Configure English as the default Astro locale; do not publish untranslated Spanish or Portuguese routes.
- Provide a visible FAQ without FAQPage JSON-LD.
- Follow the clean Vercel-inspired visual direction and support system dark mode plus a non-persistent manual toggle.
- Testing scope is governed by the current specification's Testing Decisions; this historical plan does not authorize or prohibit test work.

## Review Focus

- W-2 Box 1, Box 3, and Box 5 values affect different calculations; spouse values apply only to joint filing and do not affect the taxpayer's Social Security wage cap.
- QBI changes at filing-status thresholds; higher-income SSTB status and property basis must not be guessed when unknown.
- Expenses equal to revenue produce break-even; expenses above revenue show a cash deficit without a fabricated tax estimate.
- A blank state reserve rate means state tax is omitted; no-income-tax states default to 0% state income tax only.
- Annual/monthly mode, expense mode, and values typed beyond slider maxima stay synchronized without clamping user input.

---

## Planned File Structure

- `astro.config.mjs` — static Astro output and English-default i18n routing.
- `tsconfig.json` — strict TypeScript settings from the Astro strict template.
- `src/layouts/BaseLayout.astro` — document shell, theme initialization, metadata slots, and global styles.
- `src/pages/index.astro` — page title, description, calculator placement, FAQ, and social metadata.
- `src/components/TaxCalculator.astro` — semantic calculator form and results markup.
- `src/styles/global.css` — Tailwind import, theme tokens, typography, and accessible focus treatment.
- `src/scripts/calculator.ts` — form state, input normalization, DOM rendering, slider synchronization, theme toggle, and copy action.
- `src/lib/tax/types.ts` — tax inputs, tax-year data, and discriminated estimate result types.
- `src/lib/tax/data/2026.ts` — versioned federal brackets, standard deductions, SE thresholds, and Section 199A values.
- `src/lib/tax/federal.ts` — progressive federal tax and business-attributable tax calculation.
- `src/lib/tax/selfEmployment.ts` — SE tax, wage-base interactions, and Additional Medicare Tax.
- `src/lib/tax/qbi.ts` — one-business QBI calculation, taxable-income limits, and high-income constraints.
- `src/lib/tax/estimate.ts` — input normalization and composition of federal, SE, QBI, state-assumption, reserve, and take-home results.
- `public/_headers` — preview-host noindex rules for Cloudflare Pages.
- `AGENTS.md` — repository coding guidance, including TypeScript standards and privacy constraints.

## Tasks

### Task 1: Create the Astro project foundation

**Files:**
- Create Astro project files in the workspace root, including `package.json`, `astro.config.mjs`, `tsconfig.json`, and `src/`.
- Create `AGENTS.md` with strict TypeScript and privacy guidance.

**Interfaces:**
- Produces a strict, static Astro project with Tailwind configured and no client framework dependency.
- The repository and project setup already exist. Do not repeat project scaffolding or skill setup.

- [ ] Scaffold the current stable Astro project using the static template and TypeScript strict mode.
- [ ] Configure Tailwind using Astro's current official integration guidance; keep runtime dependencies limited to Astro, Tailwind, and the required TypeScript tooling.
- [ ] Set Astro output to `static`, default locale to English, and declare Spanish and Portuguese as future locales without creating translated pages.
- [ ] Add `AGENTS.md` rules: prefer inference for local values, explicit domain types at module boundaries, `unknown` plus narrowing over `any`, discriminated unions for result states, and pure tax functions separated from DOM code.

**Deliverable:** A minimal Astro/Tailwind project configured for static Cloudflare Pages deployment with repository guidance in place.

### Task 2: Implement the versioned federal tax calculation core

**Files:**
- Create `src/lib/tax/types.ts`.
- Create `src/lib/tax/data/2026.ts`.
- Create `src/lib/tax/federal.ts`.
- Create `src/lib/tax/selfEmployment.ts`.
- Create `src/lib/tax/qbi.ts`.
- Create `src/lib/tax/estimate.ts`.

**Interfaces:**
- `FilingStatus` is a union of `single | marriedJoint | marriedSeparate | headOfHousehold | qualifyingSurvivingSpouse`.
- `TaxpayerW2Wages` contains annual `box1`, `box3`, and `box5` totals; `SpouseW2Wages` contains annual `box1` and `box5` totals only.
- `EstimateInput` contains filing status, annual gross receipts, annual expenses, other taxable income, taxpayer and optional spouse W-2 totals, state code, nullable state reserve rate, and nullable QBI high-income inputs.
- `EstimateResult` is a discriminated union for `profit`, `breakEven`, and `loss`; only `profit` includes estimated tax, take-home, reserve rate, and invoice reserve values.

- [ ] Add tax-year data for federal brackets, standard deductions, 2026 Social Security wage base, Additional Medicare thresholds, and 2026 Section 199A thresholds and minimum deduction; keep the data separate from calculation logic.
- [ ] Implement pure progressive federal tax calculation from annual taxable income and filing status.
- [ ] Implement Schedule SE-based tax using the taxpayer's W-2 Box 3 for the Social Security cap and Box 5 for Additional Medicare; include spouse Box 1 in MFJ taxable income and spouse Box 5 for the joint Additional Medicare threshold. Do not collect spouse Box 3 because v1 does not estimate a spouse's self-employment tax.
- [ ] Implement QBI for one domestic sole-proprietor business, including the deductible half of SE tax, taxable-income cap, minimum deduction, phase-in and wage/property limits, and SSTB treatment. Assume business-paid W-2 wages are zero. If higher-income SSTB status or UBIA is unknown, omit QBI and return a visible limitation marker.
- [ ] Compute federal income tax attributable to business profit by comparing household tax with and without the business profit and its QBI deduction.
- [ ] Return a `loss` result when expenses exceed gross receipts; return `breakEven` at zero profit; never infer a tax benefit from business losses.
- [ ] Apply a user-supplied state/local percentage only to positive business profit. If the rate is null, mark state tax as omitted; use 0% only for a state with no individual income tax.
- [ ] Calculate reserve rate, per-invoice reserve, annual and monthly business take-home only for positive business profit; prevent division by zero.

**Deliverable:** A typed, framework-independent estimate function with explicit profit, break-even, loss, missing-state-rate, and missing-QBI-input states.

### Task 3: Build the calculator interface and client behavior

**Files:**
- Create `src/components/TaxCalculator.astro`.
- Create `src/scripts/calculator.ts`.
- Create `src/styles/global.css`.
- Modify `src/layouts/BaseLayout.astro`.

**Interfaces:**
- `CalculatorFormState` contains revenue period and amount, expense mode and value, filing status, state, optional state reserve rate, optional other income, taxpayer W-2 boxes, optional spouse W-2 boxes, optional QBI details, and current invoice amount.
- A single `normalizeCalculatorForm` function converts UI values to the `EstimateInput` shape from Task 2.
- A single `renderEstimate` function consumes `EstimateResult` and updates every output region.

- [ ] Build labeled annual/monthly revenue controls with number input and slider; normalize both to annual amounts before calculation.
- [ ] Build percentage and annual flat-amount expense modes; keep number inputs authoritative and synchronize sliders on every valid change.
- [ ] Set initial slider maxima to $300,000 annually/$25,000 monthly for revenue and $300,000 annually for flat expenses; extend maxima by $50,000 annual or $5,000 monthly increments when typed values exceed them.
- [ ] Add all filing statuses and a state selector for all 50 states plus D.C.; show spouse W-2 Box 1/Box 5 inputs only for Married Filing Jointly; expose optional income and W-2 fields behind “Add other income.”
- [ ] Add optional state/local reserve-rate input; prefill 0% only for states without individual income tax, and display “state tax not included” when no rate is supplied for a state with income tax.
- [ ] Reveal QBI SSTB/UBIA fields only when taxable income before QBI exceeds the Section 199A threshold; use Yes/No/Not sure and disclose when QBI is omitted.
- [ ] Render profit, break-even, and loss states distinctly; never display an ordinary positive take-home or reserve recommendation for a loss.
- [ ] Display annual and monthly results, included tax categories, invoice reserve dollars, and a visual gross-receipts allocation bar that reconciles to the categories included.
- [ ] Implement “Copy Calculation Summary” from the current in-memory state; do not copy until the user clicks.
- [ ] Follow system light/dark mode by default; implement a manual toggle without persisting theme or calculator data.
- [ ] Apply responsive layout, keyboard-operable controls, visible focus, accessible names, and reduced-motion-respecting slider interactions.

**Deliverable:** An immediately updating, accessible calculator with no server dependency and a clearly labeled result for each supported estimate state.

### Task 4: Add page content, search metadata, and Cloudflare rules

**Files:**
- Create `src/pages/index.astro`.
- Create or modify `src/layouts/BaseLayout.astro`.
- Create `public/_headers`.

- [ ] Add concise title and description plus Open Graph and Twitter/X metadata.
- [ ] Add a short privacy and estimate note near the calculator.
- [ ] Add the structured visible FAQ below the calculator; do not add FAQPage JSON-LD.
- [ ] Add host-specific `X-Robots-Tag: noindex` rules for `*.pages.dev` preview domains and their preview subdomains; leave the production custom domain indexable.
- [ ] Confirm no analytics, cookies, localStorage, APIs, or third-party scripts are introduced.

**Deliverable:** A launch-ready static page with privacy and tax-year messaging, FAQ content, social previews, and preview-only noindex behavior.

## Deferred Work

- State-bracket tax computation for all states and D.C.
- Creator-platform gross/net payout and platform withholding rules.
- Tax credits, itemized deductions, self-employed health insurance, retirement deductions, AMT, NIIT, local tax rules, and loss offsets.
- Spanish and Portuguese translations.
- Automated tests and test execution, unless the user requests them.
