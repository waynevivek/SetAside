# SetAside Tax Estimator

This context covers U.S. freelancers and creators planning how much business income remains after modeled federal taxes and a state/local reserve assumption.

## Language

**Federal filing status**:
An IRS filing category used to estimate federal income tax. It is separate from the taxpayer's business structure.
_Avoid_: LLC filing status, self-employed filing status

**Sole-proprietor business**:
One U.S. business owned by an individual whose profit is treated as the owner's self-employment income. A single-member LLC is included only when it is taxed as a sole proprietorship.
_Avoid_: LLC (without its tax treatment), business filing status

**Modeled income**:
For v1, taxable income sources represented by this estimator are the supported sole-proprietor business and optional taxpayer/spouse W-2 wages.
_Avoid_: other income (unless a specific source is named)

**Business loss**:
A period in which the supported business's expenses exceed its receipts. V1 shows the cash deficit but does not apply the loss to the federal tax calculation.
_Avoid_: tax-deductible loss (unless eligibility and tax treatment have been modeled)

**Qualified business income (QBI) deduction**:
A federal deduction that may apply to qualifying business income. Its amount can depend on the tax year, taxable income, business type, and qualified property.
_Avoid_: guaranteed 20% deduction

**Active tax year**:
The latest tax year whose official figures, forms, thresholds, and calculation rules have been verified for the release; the calculator displays this year.
_Avoid_: current year (when calendar year and tax year could be confused)

**State/local reserve rate**:
A user-chosen percentage of business profit set aside for state and local tax planning. It is not a calculated state-tax liability.
_Avoid_: state-tax estimate, calculated state tax rate

**W-2 wages**:
Employment pay reported on Form W-2. For this estimator, Box 1 is federal wages, Box 2 is federal income tax withheld, Box 3 is Social Security wages, Box 4 is Social Security tax withheld, Box 5 is Medicare wages, and Box 6 is Medicare tax withheld, including any Additional Medicare Tax withheld.
_Avoid_: W-2 income when a specific tax-box amount is meant

**Federal income-tax withholding**:
Federal income tax already withheld from wages and sent toward the taxpayer's annual federal liability. It reduces the amount remaining to pay; it does not reduce the liability itself.
_Avoid_: tax liability, tax paid (when only wage withholding is meant)

**Estimated federal tax liability**:
The projected federal tax for the year before subtracting withholding and other tax payments.
_Avoid_: amount still due

**Household federal tax liability**:
The projected federal income tax, self-employment tax, and Additional Medicare Tax for the taxpayer, plus modeled spouse wages and applicable taxes when filing jointly, before subtracting payments.
_Avoid_: freelance-attributable tax

**Freelance-attributable tax**:
The modeled additional federal taxes caused by the supported freelance business, used for the business take-home estimate.
_Avoid_: household tax liability

**Estimated federal tax payments**:
The total federal estimated-tax payments a user has made or plans to make for the selected tax year, separate from W-2 withholding.
_Avoid_: withholding, quarterly schedule

**Remaining federal amount due**:
The projected federal liability left after applicable withholding and tax payments are subtracted.
_Avoid_: total tax liability

**Estimated overpayment**:
The projected amount by which modeled federal withholding and payments exceed modeled federal liability. It is not a promise of an actual refund.
_Avoid_: guaranteed refund

**Invoice reserve recommendation**:
A planning percentage derived from modeled freelance-attributable taxes and reserve assumptions, rounded up and applied to an invoice. It is not a guaranteed tax rate.
_Avoid_: guaranteed withholding rate

**Business receipts**:
Combined receipts from the supported business, before platform fees, net of refunds, and excluding sales tax collected on behalf of the government.
_Avoid_: platform payout when gross business receipts are meant

**Average monthly receipts**:
The user's representative monthly business receipts, annualized by multiplying by 12 for tax estimates.
_Avoid_: one unusually high or low month's receipts as a full-year projection

**Annual flat business expenses**:
The total business expenses for the year, regardless of whether receipts are entered as annual or average monthly.
_Avoid_: monthly expenses when an annual amount is requested
