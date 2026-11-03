# Agent guidance

## TypeScript

- Keep tax calculations pure and separate from DOM updates.
- Define explicit domain types at module boundaries; let TypeScript infer local variables.
- Use `unknown` with narrowing instead of `any`.
- Use discriminated unions for mutually exclusive estimate states.
- Keep tax-year values in versioned data modules and record their official sources.
- Keep financial inputs in memory only; do not send them in network requests or persist them.

## Agent skills

### Issue tracker

Issues live in GitHub Issues and are managed with `gh`. See `docs/agents/issue-tracker.md`.

### Triage labels

Use the default five triage labels. See `docs/agents/triage-labels.md`.

### Domain docs

This is a single-context repo. See `docs/agents/domain.md`.

## Product workflow

- Use the Matt Pocock skills as the sole repository development workflow: Ask Matt and phase boundaries → Grill with Docs → Domain Modeling → To Spec → To Tickets → Implement → Code Review.
- Do not use Superpowers for repository work. Do not uninstall it globally.
- Use specialist skills such as Karpathy Guidelines, UI UX Max, and Graphify when relevant and available.
- Treat `docs/specs/2026-11-03-setaside-tax-estimator.md` as the current product specification, together with `CONTEXT.md` and the relevant ADRs.
- Do not create implementation issues until the user reviews and approves the specification. After approval, use To Tickets to derive work from the existing application; do not rebuild it.
