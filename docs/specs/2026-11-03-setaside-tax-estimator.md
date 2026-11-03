# SetAside: Freelancer and Creator Tax & Take-Home Estimator

> **Status: Draft for product-owner review.** This specification records the decisions from the completed Grill with Docs phase. It does not authorize application changes or implementation tickets. The existing application is to be preserved and reconciled against this spec after approval.

## Problem Statement

Full-time U.S. freelancers and creators need a quick way to estimate how much business income remains after business expenses and federal taxes, and how much of each invoice to reserve. W-2 employees with freelance side income need the estimate to account for their household wages and withholding without turning the calculator into tax-preparation software.

Today, a business-only estimate can misstate the federal tax impact when a user or joint-filing spouse also has W-2 wages. A tax-only result can also confuse household tax liability with the additional tax caused by freelance income. Users need both views, with state and local planning assumptions clearly distinguished from a calculated liability.

## Solution

SetAside will provide a focused, browser-only calculator for one U.S. sole-proprietor business. The main path asks for business receipts, expenses, filing status, and state. An optional section, collapsed by default, collects taxpayer and spouse W-2 details and estimated federal tax payments.

The result separates total household federal tax liability and its remaining balance from the incremental federal tax attributable to freelance activity. The business view estimates freelance take-home and an invoice reserve recommendation. State and local reserves remain user-entered planning assumptions; the calculator does not calculate state tax.

The product remains a planning estimator. It does not prepare a return, determine eligibility, promise an exact liability, or replace professional advice.

## User Stories

1. As a full-time freelancer, I want to enter business receipts and expenses, so that I can estimate business profit and take-home.
2. As a creator, I want to enter receipts from my business as one combined amount, so that I can use the calculator without platform-specific payout setup.
3. As a freelancer whose income varies, I want to enter annual receipts or an average monthly amount, so that I can use figures I know and see an annualized estimate.
4. As a freelancer, I want to enter expenses as a percentage of receipts or as an annual dollar amount, so that the estimate fits how I track expenses.
5. As a user, I want the input labels to explain that monthly receipts are an average month and flat expenses are annual, so that I do not mix time periods.
6. As a creator, I want to enter receipts before platform fees and put platform fees in business expenses, so that the calculation treats platform costs consistently.
7. As a user, I want the receipt definition to exclude refunds and sales tax collected for the government, so that amounts that are not business receipts do not inflate my estimate.
8. As a user, I want to choose any of the five federal filing statuses, so that the federal estimate uses the status I expect to file under.
9. As a user, I want to select my own filing status without an eligibility quiz, so that the product remains a planning tool rather than a filing-status checker.
10. As a W-2 employee with freelance income, I want an optional, collapsed W-2 section, so that I can add wage context without slowing down the basic business estimate.
11. As a taxpayer, I want to enter annual totals across my W-2 forms for Boxes 1, 2, 3, 4, 5, and 6, so that the model can use the appropriate wage, withholding, and payroll-tax information.
12. As a joint filer, I want separate spouse inputs for Boxes 1, 2, 4, 5, and 6, so that household income, withholding, and payroll-tax credits are represented without treating my spouse as a second self-employed business owner.
13. As a user, I want plain-language explanations for each W-2 box, so that I can find the relevant values on the form.
14. As a user, I want blank or zero W-2 values to be accepted, so that I can provide only the information that applies to me.
15. As a freelancer, I want to enter one annual total of federal estimated tax payments made or planned for the selected year, separately from W-2 withholding, with blank and zero accepted, so that the remaining federal balance reflects only the payments I provide.
16. As a user, I want to see total household federal tax liability before payments, so that I understand the modeled tax for the household.
17. As a user, I want W-2 federal income-tax withholding, estimated federal payments, and the remaining federal balance distinguished, so that I can see how the projected liability is covered.
18. As a user, I want the result to account for eligible excess Social Security withholding and Additional Medicare Tax withholding, so that the remaining balance does not omit those W-2 amounts.
19. As a user whose payments exceed modeled federal liability, I want the surplus shown as an estimated overpayment, so that I can see the difference without being promised a refund.
20. As a W-2 side hustler, I want the calculator to account for combined W-2 wages and freelance income under progressive federal brackets, so that the estimate reflects their interaction.
21. As a freelancer, I want to see tax attributable to my business separately from total household liability, so that wages from my day job are not treated as taxes caused by the business.
22. As a freelancer, I want business take-home calculated using business expenses, freelance-attributable federal taxes, and any state/local reserve assumption, so that the business view does not subtract the household's entire W-2 tax bill from business receipts.
23. As a freelancer, I want federal self-employment tax to account for my W-2 Social Security wages, so that the Social Security wage-base interaction is reflected.
24. As a joint filer, I want spouse Medicare wages included where they affect Additional Medicare Tax, so that the joint estimate uses the modeled household wages.
25. As a qualifying business owner, I want the QBI deduction included under the active tax-year rules, so that the federal estimate does not routinely omit a potentially material deduction.
26. As a higher-income business owner, I want specified-service-trade and qualified-property questions to appear only when the active-year QBI rules make them relevant, so that the main calculator stays focused.
27. As a user who cannot provide required high-income QBI details, I want the deduction omitted with a clear warning that the estimate may be higher than my actual federal tax liability, so that missing information is not silently guessed.
28. As a user whose business expenses equal receipts, I want a break-even result with the household W-2 estimate retained and zero freelance take-home and reserve, so that the business result is clear without hiding household tax context.
29. As a user whose expenses exceed receipts, I want the business loss and cash deficit shown separately and a W-2-based federal estimate shown without applying the loss, so that I get useful household information without an unsupported loss benefit.
30. As a user in a state without individual income tax, I want the state-income-tax reserve to default to 0%, so that the state portion is represented without pretending to calculate local taxes.
31. As a user in another state, I want the state/local reserve to remain blank until I enter a percentage, so that the product does not invent a state-tax estimate.
32. As a user, I want to enter a custom state/local reserve percentage, including a local tax reserve, and see how it changes business take-home, so that I can use my own planning assumption.
33. As a user who leaves the state/local rate blank, I want the result to say state/local reserves are excluded, so that I do not mistake federal-only take-home for an all-tax estimate.
34. As a freelancer, I want a suggested invoice reserve rate based on the modeled business-attributable tax and my state/local reserve, so that I have a repeatable planning amount for each invoice.
35. As a freelancer, I want the suggested rate rounded up to the next whole percentage point and applied to an invoice amount, so that the displayed reserve is easy to use and contains no hidden extra buffer.
36. As a user, I want the invoice reserve labeled as a planning recommendation rather than a guaranteed tax rate, so that I understand its limits.
37. As a user, I want annual and monthly business results and a reconciled visual breakdown, so that I can see how receipts divide between expenses, modeled business taxes/reserves, and take-home.
38. As a user, I want to copy a calculation summary only after clicking the copy button, so that I control when my scenario details are placed on the clipboard.
39. As a user, I want the summary to include the selected tax year, inputs, outputs, and key limitations, so that shared numbers retain their context.
40. As a user, I want the calculator to update immediately and remain usable with keyboard, slider, and number inputs, so that I can explore scenarios accessibly.
41. As a user, I want a responsive layout, light/dark appearance, and a manual non-persistent theme toggle, so that the tool is comfortable on my device without storing preferences.
42. As a privacy-conscious user, I want the calculation to run locally without accounts, analytics, cookies, persistent storage, APIs, or third-party scripts, so that my financial inputs remain on my device.
43. As a visitor, I want the calculator first and a concise visible FAQ below it, so that I can get an estimate before reading supporting explanations.
44. As a visitor, I want page title, description, and Open Graph/Twitter metadata, so that the page is understandable in search and social previews.
45. As a site owner, I want preview deployments marked noindex while production stays indexable, so that preview pages do not compete with the public site.
46. As a site owner, I want English as the launch route with Spanish and Portuguese routing reserved for later, so that untranslated pages are not published.

## Implementation Decisions

### Product boundary

- The primary audience is full-time U.S. freelancers and creators. W-2 employees with freelance side income are also supported.
- V1 models one U.S. sole-proprietor business. A single-member LLC is included only when taxed as a sole proprietorship. S-corporations, partnerships, and multiple businesses are excluded.
- The five federal filing statuses are supported. Users self-select; SetAside does not test eligibility.
- Modeled income is limited to the supported business and optional taxpayer/spouse W-2 wages. Investment, rental, and other income sources are excluded.
- Use the standard deduction for the selected filing status. Exclude itemized deductions, personal deductions, and other tax credits. Disclose that omissions can make the estimate higher than actual liability.

### Business receipts and expenses

- Use one combined business-receipts input across creator and freelancer sources. Receipts are before platform fees, net of refunds, and exclude sales tax collected on behalf of the government.
- Platform fees are included as business expenses. No platform-specific gross-to-net payout or platform withholding flow is modeled.
- Support annual receipts or an average monthly amount. Annualize average monthly receipts by multiplying by 12; do not model seasonal variability.
- Support expense percentage or flat annual expenses. Flat expenses remain annual even when monthly receipts are displayed. Make units explicit beside inputs.
- Do not clamp expenses to receipts. At break-even, show zero business profit; when expenses exceed receipts, show the cash deficit without applying the business loss to federal taxable income.

### Federal tax model and results

- Maintain tax-year values as versioned data and select the latest tax year whose official figures, thresholds, forms, and calculations have been verified before release. Display the active tax year. Use 2026 only if its final sources and calculations pass that review; otherwise select the latest fully verified year.
- Calculate household federal income tax using modeled taxpayer and (for joint returns) spouse Box 1 wages, business profit, the standard deduction, applicable self-employment adjustments, the QBI deduction when supported, and the active year's progressive brackets.
- Calculate self-employment tax for the single supported business using taxpayer Box 3 Social Security wages for the individual's wage-base interaction. Use taxpayer and spouse Box 5 Medicare wages as applicable to the active-year Additional Medicare Tax rules. The model does not include a spouse's self-employment business.
- Return two distinct views: total modeled household federal tax liability and remaining household federal balance; and the incremental federal tax attributable to the freelance business, used for freelance take-home and reserve. Household liability comprises modeled federal income tax, self-employment tax, and Additional Medicare Tax before payments. Calculate the freelance-attributable amount as the difference between modeled household federal liability with positive business profit and a W-2-only baseline using the same filing status, wages, and standard deduction. Include the modeled changes caused by the business, including federal income tax, self-employment tax, and Additional Medicare Tax. Calculate this before payments; withholding and estimated payments affect only the household remaining balance. Do not subtract household W-2 tax from business receipts as if the business caused it.
- Total liability is shown before payments. Apply taxpayer/spouse W-2 federal income-tax withholding (Box 2), eligible excess Social Security withholding based on Box 4, Additional Medicare withholding derived from Box 5 and Box 6, and one optional annual total of federal estimated payments made or planned for the active tax year to the remaining-balance calculation. The estimated-payment input accepts blank or zero and says it covers the selected tax year. Follow active-year IRS instructions for eligibility, calculation, and ordering; do not assume all Box 4 or Box 6 amounts are fully creditable.
- Show a positive remaining federal amount due when liability exceeds modeled payments. If modeled payments exceed liability, show the surplus as an estimated overpayment, not a refund; explain that the actual refund depends on the complete tax return and other adjustments.
- For a business loss, show the W-2-based federal estimate without applying the business loss; disclose that this may be higher than actual liability. Omit business take-home and reserve recommendations for loss cases. At break-even, retain the household W-2 view and show zero freelance take-home and reserve.
- State/local reserve assumptions do not enter federal liability. Do not label them as calculated state taxes.

### W-2 inputs

- Keep W-2 inputs in an optional section collapsed by default. Accept blank and zero values and explain each box in plain language.
- Aggregate annual totals across the user's W-2 forms: taxpayer Boxes 1 (federal wages), 2 (federal income tax withheld), 3 (Social Security wages), 4 (Social Security tax withheld), 5 (Medicare wages), and 6 (Medicare tax withheld, including any Additional Medicare Tax).
- For Married Filing Jointly, collect spouse Boxes 1, 2, 4, 5, and 6. Do not collect spouse Box 3 because the model supports only the taxpayer's self-employment business and the spouse's Box 3 does not reduce the taxpayer's Social Security wage base.
- Keep W-2 withholding separate from estimated federal tax payments. Use Box 6 with Box 5 to identify only the Additional Medicare withholding that is creditable; use Box 4 only to the extent the active-year IRS rules allow excess Social Security withholding to be credited.

### QBI

- Include the QBI deduction for the supported single business under the active-year rules. Assume no business-paid W-2 wages, multiple-business aggregation, QBI loss carryforwards, REIT/PTP income, cooperative items, self-employed health-insurance deductions, or retirement deductions.
- Show specified-service-trade status and qualified-property basis questions only when taxable income before QBI is above the active-year threshold and the answer can affect the deduction.
- If required high-income information is missing or unknown, omit QBI rather than guess and disclose that the resulting estimate may be higher than actual federal tax liability.

### State/local planning and invoice reserve

- The state selector provides context; V1 does not calculate state tax brackets or state tax liability.
- In states without individual income tax, initialize the user-editable state/local reserve rate to 0%, representing the state income-tax portion; users may increase it to include local taxes. For other states, leave the combined state/local reserve blank until the user enters a rate. A user-entered rate is not decomposed into state and local liability.
- Apply a user-entered state/local reserve percentage to positive business profit. If blank, exclude state/local reserves from business take-home and label the exclusion. Always describe the rate as a user-defined planning assumption.
- Derive the invoice reserve rate from freelance-attributable federal taxes plus the user-supplied state/local reserve divided by projected gross receipts. Round up to the next whole percentage point, apply it to each invoice amount, and add no separate buffer. Label it a planning recommendation, not a guaranteed tax rate.
- Keep the visual allocation reconciled to business receipts: business expenses, freelance-attributable tax and state/local reserve amounts, and freelance take-home. Do not use total household liability as a business-bar segment.

### Architecture and experience

- Preserve and extend the existing static Astro application with client-side TypeScript and Tailwind. Do not rebuild it or introduce a client UI framework, backend, tax API, analytics, cookies, persistent storage, or third-party scripts.
- Keep tax calculations pure and deterministic, separate from DOM updates. Form normalization and result rendering remain UI concerns. `estimateTax()` is the primary calculation/test seam: it accepts a complete input scenario and returns the household and freelance results, including distinct profit, break-even, and loss states.
- Keep calculator values and manual theme choice in memory only. Clipboard copying occurs only after an explicit user action.
- Retain annual/monthly controls, expense percentage/annual amount controls, number inputs and keyboard-operable sliders, responsive layouts, visible focus, reduced-motion support, system theme detection, and a manual non-persistent theme toggle.
- Show the calculator before a concise privacy/estimate note and a visible FAQ. Include title, description, Open Graph, and Twitter/X metadata. Do not add FAQPage JSON-LD.
- Use static Cloudflare Pages output, host-specific noindex headers for preview domains, and an English default route with future Spanish and Portuguese routing but no untranslated launch pages.

## Testing Decisions

- **Primary seam:** test complete input scenarios through pure, deterministic `estimateTax()` calls. For profitable scenarios, assert both household federal liability/balance and freelance-attributable tax/take-home outputs, rather than testing internal implementation details. For break-even and loss scenarios, assert the required household W-2 view and that freelance take-home/reserve outputs are zero or absent as specified.
- Cover all five filing statuses; taxpayer and joint-spouse W-2 box handling; Box 2 withholding; eligible Box 4 excess Social Security credits; Box 5/6 Additional Medicare liability and withholding; annual estimated payments; QBI normal and high-income thresholds; missing QBI details; profit, break-even, and loss states; and overpayment outcomes.
- Validate expected outputs against authoritative, final IRS forms, instructions, worksheets, and examples for the selected tax year. Include boundary scenarios for Social Security wage bases, Additional Medicare thresholds, filing-status brackets, and QBI thresholds/phase-ins.
- Keep calculations pure and deterministic: no DOM, wall-clock, network, browser storage, or clipboard dependency at the test seam.
- UI verification remains manual for now, including period/expense synchronization, optional W-2 field visibility, slider/number consistency, accessible keyboard behavior, copy action, dark mode, and responsive layouts.
- No tests are to be written or run during this To-Spec phase. The repository currently has no test runner or existing test patterns; test tooling and test implementation belong to an approved implementation ticket.

## Calculation Risks and Verification Gates

1. **Active tax year is not yet validated.** The current application has hard-coded 2026 values. At the time of this draft, the IRS 2026 Form 1040, Form 8959, and Form 8995 instructions are still labeled drafts. Draft values cannot satisfy the release policy. The 2025 model is also not yet verified end to end. Select a year only after reviewing its final official sources.
2. **Household liability and business attribution are different calculations.** The current application returns incremental federal income tax attributable to the business, not a complete household liability plus payment balance. The revised estimate must avoid double-counting W-2 income tax in freelance take-home.
3. **W-2 withholding and payroll credits require form-based reconciliation.** The current application lacks Boxes 2, 4, and 6 and estimated payments. Box 6 includes regular Medicare and possibly Additional Medicare withholding; only the eligible Additional Medicare amount is credited. Box 4 excess is creditable only under applicable IRS rules, including multiple-employer conditions. Verify taxpayer and spouse handling against the active-year instructions.
4. **Self-employment tax interactions require validation.** Check Schedule SE treatment, the taxpayer's Box 3 wage-base interaction, the 92.35% net-earnings factor, deductible half of SE tax, and Additional Medicare thresholds/combined household wage rules against the active year's final materials.
5. **QBI rules and data may change by year.** Verify the active year's Forms 8995 and 8995-A, including minimum deduction, thresholds, phase-in ranges, SSTB treatment, qualified-property limits, and taxable-income cap. The current implementation must not be assumed correct because it has a QBI module.
6. **The simplified model intentionally omits tax adjustments.** Standard deduction only, no personal deductions or other credits, and no other income may make the estimate higher than actual household liability. State/local reserves are user assumptions, not state tax estimates.
7. **Business losses are not included in federal taxable income.** Loss cases use a W-2-based estimate and may overstate actual tax if the loss is allowable. This is intentional and must be disclosed near the result.
8. **Single-business assumptions constrain QBI and payroll modeling.** The model assumes one sole-proprietor business, no business employees, and no spouse self-employment income. Do not extrapolate results to S-corporations, partnerships, multiple businesses, RRTA compensation, or other unsupported situations.

As of this draft, the IRS lists the 2026 [Form 1040](https://www.irs.gov/pub/irs-dft/f1040--dft.pdf), [Form 8959](https://www.irs.gov/pub/irs-dft/f8959--dft.pdf), and [Instructions for Form 8995](https://www.irs.gov/pub/irs-dft/i8995--dft.pdf) in its [draft tax forms area](https://www.irs.gov/draft-tax-forms), which says not to rely on draft forms or instructions. The active-year calculation review must use the final versions where available and retain a source/version record.

## Out of Scope

- State-specific income-tax calculations, state brackets, local tax engines, state estimated-payment balances, and state tax deductions.
- S-corporations, partnerships, multi-member LLCs, multiple businesses, and a spouse's self-employment business.
- Investment, rental, capital-gain, retirement, pension, platform-specific, or other income sources beyond the defined W-2 and supported business inputs.
- Itemized deductions, personal deductions, tax credits other than the explicitly modeled W-2/estimated-payment credits, AMT, NIIT, and tax-return preparation.
- Applying business losses against W-2 income or calculating the tax effect of a loss.
- Quarterly estimated-payment schedules, reminders, safe-harbor calculations, underpayment penalties, or IRS penalty calculations.
- Platform-specific gross/net payout rules or platform withholding.
- Filing-status eligibility checks, accounts, sign-up forms, pop-ups, analytics, advertising, and data collection.
- Spanish and Portuguese translations during v1 launch.
- FAQPage JSON-LD.

## Further Notes

### Incorporation of Grill with Docs decisions

| ADR | Decision captured in this spec |
| --- | --- |
| 0001 | State/local tax is a user-supplied reserve assumption, not a state tax calculation. |
| 0002 | Full-time freelancers and creators are primary; W-2 side income is also supported. |
| 0003 | One annual estimated federal tax payment total is separate from withholding and reduces remaining balance. |
| 0004 | All five federal filing statuses are supported without checking eligibility. |
| 0005 | V1 covers one sole-proprietor business, including a default single-member LLC; other structures are excluded. |
| 0006 | Optional, collapsed W-2 inputs use taxpayer Boxes 1/2/3/4/5/6 and spouse Boxes 1/2/4/5/6 for joint filing. |
| 0007 | Modeled income is limited to the business and optional taxpayer/spouse W-2 wages. |
| 0008 | Box 6 is reconciled to Box 5 to account for eligible Additional Medicare withholding. |
| 0009 | Box 4 is used to account for eligible excess Social Security withholding. |
| 0010 | QBI is included with conditional high-income inputs and an omission warning when required details are unavailable. |
| 0011 | Use the latest fully verified tax year at release; display the active year. |
| 0012 | Show surplus payments as an estimated overpayment, not a promised refund. |
| 0013 | Loss cases show a W-2-based estimate without applying the business loss and omit business take-home/reserve. |
| 0014 | Household liability and freelance-attributable tax are separate views; break-even keeps the household view. |
| 0015 | Use the standard deduction and exclude itemized/personal deductions and other credits. |
| 0016 | Use one combined business-receipts amount; platform fees are expenses; no platform-specific payout/withholding logic. |
| 0017 | No-income-tax states default to 0%; other states remain blank until entered; state/local exclusions are explicit. |
| 0018 | Keep the visible FAQ and omit FAQPage JSON-LD. |
| 0019 | Round the reserve recommendation up to a whole percentage, apply it to invoices, and add no buffer. |
| 0020 | Monthly receipts are average-month values annualized by 12; flat expenses are annual; units are shown beside inputs. |

### Existing implementation to reconcile after approval

The existing Astro application and pure TypeScript calculation boundary are the base to preserve; the requirements do not call for an architecture rewrite. The current `estimateTax()` function is a suitable test seam, but its current result model is incomplete for the approved scope:

- It currently estimates incremental federal income tax and self-employment taxes for profitable business scenarios, but does not return total household liability or the remaining balance after payments.
- Its break-even and loss result states do not include the W-2-based household estimate required by ADRs 0013 and 0014.
- Its current input model includes other taxable income, which is outside the approved v1 scope, and does not include W-2 Boxes 2, 4, and 6 or estimated federal payments. The spouse input currently covers only Boxes 1 and 5.
- Tax-year data is currently fixed to 2026, and the existing QBI implementation has not been validated against final IRS materials. Presence of calculation modules is not evidence that their results are release-ready.

After spec approval, To Tickets should describe the changes needed to close these gaps while retaining the current Astro application and pure calculation boundary.

### Workflow and approval gate

This is a review draft produced in the Matt Pocock To Spec phase. The project workflow is Ask Matt and phase boundaries → Grill with Docs → Domain Modeling → To Spec → To Tickets → Implement → Code Review. The existing application is preserved. After this spec is reviewed and approved, To Tickets can create blocker-aware tickets based on gaps in the current implementation. No implementation tickets or code changes are part of this spec-drafting phase.
