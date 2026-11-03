# SetAside

SetAside is a static Astro site with a browser-only tax and take-home estimator for U.S. freelancers and independent creators.

## Local development

```sh
npm install
npm run dev
```

Create a production build with `npm run build`. The static output is written to `dist/`, which can be deployed to Cloudflare Pages.

## Scope and privacy

- Tax calculations run in plain TypeScript in the browser. There is no API, analytics, cookie, or calculator data in persistent storage.
- Tax-year inputs live in versioned files under `src/lib/tax/data/` and need official IRS source review before annual updates.
- State and local tax is a user-entered reserve assumption, not a state tax calculation.
- Preview Pages hosts receive `X-Robots-Tag: noindex` through `public/_headers`.
- Astro is configured for English at `/`, with Spanish and Portuguese reserved for future localized pages.

Read the [current product specification](docs/specs/2026-11-03-setaside-tax-estimator.md) for the product and tax-model boundaries. The superseded design draft and implementation plan are archived in `docs/archive/` and do not authorize work.
