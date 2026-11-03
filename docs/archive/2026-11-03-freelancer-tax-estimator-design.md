# Freelancer & Creator Tax & Take-Home Estimator

> **Status: superseded historical draft.** The current product specification is the [active spec](../specs/2026-11-03-setaside-tax-estimator.md). This earlier draft contains assumptions that changed during Grill with Docs, including other income and payment handling. Use the current specification, `CONTEXT.md`, and ADRs 0001–0020 as the source of truth.

## Intent

Build a fast, private, single-purpose calculator that helps U.S. freelancers and independent creators estimate how much of their business income remains after expenses and estimated taxes. The primary task is cash planning: users can estimate take-home pay and decide what share of each invoice to reserve. The page should be useful immediately, without an account, signup, popup, or data collection.

The product is a planning estimate, not tax preparation software or an eligibility checker. It targets individuals with one self-employed business, including sole proprietors and default single-member LLCs. LLC status is not a federal filing status; the IRS treatment depends on ownership and tax elections. [IRS guidance](https://www.irs.gov/businesses/small-businesses-self-employed/single-member-limited-liability-companies)

## Goals

- Let a user produce and copy a useful estimate in under a minute.
- Calculate entirely in the browser and keep financial inputs out of network requests, analytics, cookies, and persistent storage.
- Show an annual and monthly view of revenue, expenses, estimated taxes, take-home pay, and a suggested reserve rate.
- Support all five U.S. federal filing statuses, an optional user-supplied state/local reserve assumption, annual or average-monthly revenue, and percentage or flat-amount expenses.
- Make the page responsive, keyboard accessible, and comfortable in light and dark themes.
- Provide useful FAQ content and social sharing metadata.

## Non-goals

- Preparing or filing tax returns, determining filing-status eligibility, or replacing professional tax advice.
- Modeling corporations, S-corporations, partnerships, multiple businesses, payroll taxes for employees, or non-U.S. tax systems. For the QBI wage limitation, v1 assumes the solo business has no employees and therefore no business-paid W-2 wages.
- Modeling tax credits, itemized deductions, self-employed health-insurance deductions, retirement deductions, AMT, NIIT, state tax rules, or estimated payments already made. Estimate the federal QBI deduction only within the explicitly scoped single-business model below.
- Collecting user data, providing accounts, or supporting analytics and advertising in v1.
- Translating page content in v1. The route structure should make English, Spanish, and Portuguese paths straightforward to add later.

## Anti-goals

- No backend endpoint, tax API, or submission of calculator values to Cloudflare or another service.
- No claim that the result is filing-grade or exact for every household.
- No signup funnel, popups, or long marketing section before the calculator.
- No Google FAQ rich-result promise. Google removed the FAQ rich-result feature from Search in 2026; retain the FAQ for readers and organic landing-page content. [Google Search updates](https://developers.google.com/search/updates?isappinstalled=0)

## Constraints

- AstroJS static multi-page site, Tailwind CSS, TypeScript, and Cloudflare Pages.
- Use plain client-side TypeScript for the interactive calculator, with no React, Preact, or other UI runtime.
- Use a clean Vercel-inspired visual style: restrained neutrals, crisp typography, clear spacing, and subtle borders.
- All calculations and UI updates happen locally and immediately.
- The provided workspace is currently empty and is not initialized as a Git repository. This document is a draft in the workspace and has not been committed.
- The Matt Pocock setup skill should be run after a repository is established and before using the repository-based spec, ticket, or implementation flows. That setup configures issue tracking and agent/domain documentation; coding conventions are a separate project decision.

## Approaches

### A. Astro page with plain TypeScript — selected

Use an Astro page for static markup and metadata, Tailwind for styling, and a focused TypeScript module for form state, tax calculations, validation, sliders, theme control, and copy-to-clipboard behavior. Keep tax calculation functions pure and separate from DOM updates. Put tax-year constants in versioned data modules.

This matches the single-form scope and high-performance requirement while avoiding a client-side UI framework. The user selected this approach.

### B. Astro page with a hydrated React or Preact island — not selected

A component framework would provide reactive rendering and conditional fields, but adds a client runtime and framework-specific state machinery for one calculator. The user chose plain TypeScript to keep the client implementation small.

## Product decisions

### Audience and use

- Launch audience: U.S. solo freelancers and creators with one self-employed business; includes sole proprietors and default single-member LLCs.
- Primary job: cash planning and setting aside tax money from invoices.
- Not filing-grade; users select the filing status they expect to use. The tool does not determine eligibility.
- Success target: users can get and copy a useful estimate in under one minute. Organic discovery is secondary. The product has no signup funnel.

### Tax scope decisions

- **State estimate:** do not show a state-specific flat-rate preset for states with income tax. One preset cannot reflect a user's filing status, household income, state deductions, or local taxes, and a top marginal rate is not a useful effective rate. Allow an optional user-supplied percentage of business profit instead. Use 0% only for states without individual income tax; if a user in another state leaves it blank, show the federal estimate and state tax as not included. Consider a state-specific model later only if we can source and maintain it accurately.
- **QBI deduction:** include the federal deduction for a single qualifying domestic sole-proprietor business. Leaving it out can materially overstate federal tax: for tax year 2026, a single filer with $80,000 business profit, no other income or W-2 wages, no capital gains, and the standard deduction could see roughly $2,180 more federal income tax in an estimate that omits QBI. Use the simple path when taxable income before QBI is at or below the Section 199A threshold; conditionally collect specified-service trade status and qualified-property basis when income enters the higher-income limits. Apply the active-year minimum-deduction rules. Assume no employees, multiple-business aggregation, carryforwards, health-insurance or retirement deductions, REIT/PTP income, or cooperative items. If eligibility or required advanced inputs are unknown, do not assume a deduction; disclose the limitation.

### Inputs

- **Business revenue:** annual amount or average monthly amount. Monthly values are multiplied by 12; seasonal variation is not modeled. Define revenue as business receipts before expenses, excluding sales tax collected and net of refunds.
- **Business expenses:** either a percentage of revenue or an annual flat amount, selected with a mode switch.
- **Filing status:** Single, Married Filing Jointly, Married Filing Separately, Head of Household, or Qualifying Surviving Spouse.
- **State/local reserve assumption:** select a state or D.C. A state with no individual income tax gets a 0% default for state income tax only; local taxes and gross-receipts or privilege taxes are not included unless the user adds them to a custom rate. For other states, do not invent a state-specific flat-rate preset; let the user enter an optional percentage of business profit to reserve for state and local income taxes. If no percentage is entered, show federal-only take-home and clearly label state tax as not included. The rate is a user assumption, not a state tax calculation.
- **Other annual income:** optional other taxable income on the return, excluding the self-employed business and W-2 amounts entered separately.
- **W-2 wages:** optional combined amounts across all of the user's W-2s: Box 1 federal taxable wages, Box 3 Social Security wages, and Box 5 Medicare wages. For Married Filing Jointly, also ask for the spouse's combined Box 1 and Box 5 amounts; spouse Box 3 is not needed because the spouse has no self-employment business in v1. Keep these as separate fields because each feeds a different calculation. Box 1 is included in household federal income tax; the user's Box 3 wages affect their Social Security wage cap; Box 5 wages affect Additional Medicare Tax. A spouse's Box 5 wages affect the joint Additional Medicare threshold. Do not ask for withholding in v1.
- **Higher-income QBI details:** only when taxable income before QBI is above the applicable Section 199A threshold, ask whether the business is a specified-service business (Yes / No / Not sure), with examples from IRS guidance including consulting, performing arts, and income from endorsements or use of a creator's identity. Ask for qualified-property UBIA as the original tax basis of tangible, depreciable property used by the business and still within its depreciable period; do not describe it as current market value. Assume business-paid W-2 wages are $0 in v1.
- Optional income details live behind an “Add other income” control. Show spouse W-2 Box 1 and Box 5 fields only for Married Filing Jointly. Defaults are zero. Label box numbers explicitly and ask users to combine the amounts across all their W-2 forms.
- One explicitly labeled tax year is active at a time and updated annually. Use the latest year whose official inputs have been verified at release; if released against current 2026 data, use 2026.

### Calculation model

- Annualize monthly inputs before calculating; derive monthly outputs by dividing the annual estimate by 12.
- Business profit is business receipts minus business expenses.
- Federal income tax uses the selected filing status, the tax-year progressive tax table, the standard deduction, other income, and the deductible half of self-employment tax.
- Estimate the incremental income tax attributable to the business by comparing estimated tax with business profit included against estimated tax without the business profit.
- Estimate self-employment tax using the Schedule SE basis, including Social Security wage-base interactions with the worker's W-2 wages, Medicare tax, and Additional Medicare Tax thresholds. For joint returns, include spouse wages in the Additional Medicare Tax calculation.
- Estimate the federal qualified business income (QBI) deduction for the user's one domestic sole-proprietor business. Calculate QBI after the deductible half of self-employment tax and apply the taxable-income limitation and active-year minimum-deduction rules. For taxable income above the annual Section 199A threshold, apply the single-business wage/property and specified-service-trade limits using the qualified-property basis and trade-status inputs. Assume zero business-paid W-2 wages because the product excludes employers; keep those inputs distinct from the taxpayer's own W-2 wages. If eligibility or required inputs are unknown, do not assume a deduction and identify that QBI was not included. Assume no QBI loss carryforwards, aggregation, REIT/PTP income, cooperative payments, self-employed health-insurance deduction, or retirement deductions.
- State/local reserve is a user-supplied percentage of business profit, applied only when provided. For a state without individual income tax, default to 0% for state income tax only. Do not label this as a computed state tax bill or state-bracket estimate.
- Do not silently cap business expenses at revenue. If expenses exceed receipts, show the business loss/cash deficit and state that the tax and take-home estimate is unavailable because business-loss treatment is outside v1. At break-even, show zero business-attributable tax reserve and zero business take-home.
- Exclude tax credits, itemized deductions, health-insurance and retirement deductions, state/local deductions, full state tax calculations, AMT, NIIT, other self-employment activity, and tax already paid or withheld.
- The suggested reserve rate is total estimated business-attributable federal income tax, self-employment tax, and state estimate divided by business receipts, rounded up to the next whole percentage point. Do not add a separate arbitrary buffer.
- Reserve dollars for an invoice equal the suggested reserve percentage multiplied by the invoice amount.
- Results include category amounts, monthly and annual take-home, and a breakdown where gross receipts are the total split into expenses, estimated taxes, and estimated take-home.

The 2026 IRS sources publish a 2026 standard deduction of $16,100 for Single and Married Filing Separately, $24,150 for Head of Household, and $32,200 for Married Filing Jointly and surviving spouses, with year-specific progressive tax tables. For 2026, the Section 199A threshold is $403,500 for Married Filing Jointly, $201,775 for Married Filing Separately, and $201,750 for other filing statuses; verify the final 2026 Form 8995/8995-A instructions before release and update these annual inputs. The 2026 Social Security wage base is $184,500. These are versioned inputs, not permanent constants. [IRS 2026 inflation adjustments](https://www.irs.gov/irb/2025-45_IRB), [IRS QBI overview](https://www.irs.gov/newsroom/qualified-business-income-deduction), [2026 Form 8995 instructions](https://www.irs.gov/pub/irs-dft/i8995--dft.pdf), [IRS self-employment tax guidance](https://www.irs.gov/businesses/small-businesses-self-employed/self-employment-tax-social-security-and-medicare-taxes), [IRS Additional Medicare Tax](https://www.irs.gov/taxtopics/tc560)

### Page and interaction design

- Place the calculator first, with a short heading and privacy/estimate note. Keep FAQ content below it.
- Use the approved clean, Vercel-inspired aesthetic with restrained colors, crisp typography, generous spacing, and subtle borders.
- On desktop, place inputs and results side by side; stack them on mobile.
- Keep optional income fields collapsed until requested. Show only applicable conditional fields.
- Follow the device theme by default and provide a manual light/dark toggle. Do not persist calculator inputs or theme choice.
- Update results immediately on valid input changes. Number fields remain directly editable alongside sliders; sliders support pointer and keyboard interaction. Revenue sliders start at $0–$300,000 annually or $0–$25,000 monthly; flat annual-expense sliders start at $0–$300,000; percentage expenses run from 0%–100%. When a typed dollar value exceeds a slider maximum, extend the maximum to the next $50,000 annual or $5,000 monthly step, without clamping the typed value. Use $100 slider steps for dollar amounts and 1% steps for percentage expenses; direct number inputs remain authoritative.
- Include a visible tax-category breakdown with annual and monthly values.
- The copy button copies the scenario inputs, tax year, filing status, state, estimated tax breakdown, take-home values, reserve rate, and short assumptions note only after an explicit click.
- Use responsive layout, visible focus styles, semantic labels, and accessible slider/number-input synchronization.

### Privacy and hosting

- Do not use analytics, cookies, localStorage, APIs, or any network request containing financial inputs.
- Keep form values in memory for the page session; copy data only after the user requests it.
- Use static output on Cloudflare Pages.
- Add `public/_headers` host-specific rules to apply `X-Robots-Tag: noindex` to Pages preview hosts and preview subdomains. Do not apply `noindex` globally to the production custom domain. Cloudflare documents hostname-specific `_headers` rules for Pages preview URLs. [Cloudflare Pages headers](https://developers.cloudflare.com/pages/configuration/headers/)
- Configure Astro i18n with English as the default route and leave Spanish/Portuguese translations for later. Do not publish untranslated `/es/` or `/pt/` duplicates at launch.

### SEO

- Include page title and description plus Open Graph and Twitter/X card metadata for social sharing.
- Publish a visible FAQ below the calculator. Do not add FAQPage JSON-LD for Google rich snippets because Google no longer shows FAQ rich results.
- Keep production indexable and preview deployments noindex.

## Acceptance criteria for the eventual implementation

- A user can enter annual or average monthly revenue, expenses, filing status, state, and optional income details and immediately see a consistent estimate.
- Annual and monthly outputs reconcile; gross receipts equal business expenses plus estimated taxes plus estimated take-home.
- The reserve rate and per-invoice reserve are reproducible from the displayed tax categories; take-home is labeled as after only the taxes included in the estimate.
- W-2 Box 1, Box 3, and Box 5 totals feed only their intended federal tax calculations; spouse W-2 inputs appear only for joint filing.
- If business expenses exceed receipts, show the loss and cash deficit without inventing a tax or take-home estimate.
- QBI is included only when supported by the selected tax-year rules and supplied inputs; exclusions and assumptions are disclosed in the result and copied summary.
- The chosen tax year and assumptions are visible in the interface and copied summary, including when state tax or QBI limitations are not included.
- Calculator values never enter network requests or persistent browser storage.
- Preview URLs receive `X-Robots-Tag: noindex`; production custom-domain responses remain indexable.
- FAQ content is present without a Google FAQ rich-result claim.
- Final calculations are checked against official IRS worksheets and examples for the active tax year before release.
- QBI calculations are checked against the active-year Forms 8995 and 8995-A and verified at the threshold and phase-in boundaries.

## Source notes

- IRS filing statuses and joint-return income treatment: [IRS filing status](https://www.irs.gov/filing/filing-status?lv=true), [2025 Form 1040 instructions](https://www.irs.gov/instructions/i1040gi)
- U.S. single-member LLC classification: [IRS single-member LLC guidance](https://www.irs.gov/businesses/small-businesses-self-employed/single-member-limited-liability-companies)
- 2026 brackets and standard deduction: [Internal Revenue Bulletin 2025-45](https://www.irs.gov/irb/2025-45_IRB)
- 2026 QBI rules: [IRS QBI overview](https://www.irs.gov/newsroom/qualified-business-income-deduction), [2026 Form 8995 draft instructions](https://www.irs.gov/pub/irs-dft/i8995--dft.pdf), [Form 8995-A instructions](https://www.irs.gov/instructions/i8995a)
- 2026 estimated-tax tables and Additional Medicare Tax thresholds: [Publication 505 (2026)](https://www.irs.gov/publications/p505), [Topic 560](https://www.irs.gov/taxtopics/tc560)
- Preview response headers: [Cloudflare Pages headers](https://developers.cloudflare.com/pages/configuration/headers/)
- Google FAQ rich-result status: [Google Search documentation updates](https://developers.google.com/search/updates?isappinstalled=0)
