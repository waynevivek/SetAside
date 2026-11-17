# Round the invoice reserve recommendation up without an extra buffer

Derive the recommended reserve rate from modeled freelance-attributable federal taxes plus the user-supplied state/local reserve, divided by projected gross business receipts. Round the percentage rate up to the next whole percentage point, apply that rate to each invoice, and preserve cents in the calculated dollar reserve amount without rounding up to a whole dollar. Add no separate buffer. Label the result as a planning recommendation, not a guaranteed tax rate.
