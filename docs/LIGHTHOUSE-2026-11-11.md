# Lighthouse — 2026-11-11

The production bundle was served with `vite preview` at `http://127.0.0.1:4174`.
Lighthouse 13.6.0 ran three times per route/profile with the four standard
categories, MSW enabled, and Chrome headless. Scores below are medians; LCP
and TBT are milliseconds, and CLS is unitless.

| Route/profile | Performance | Accessibility | Best practices | SEO | LCP | CLS | TBT |
|---|---:|---:|---:|---:|---:|---:|---:|
| Home / desktop | 98 | 98 | 96 | 92 | 1059 | 0.002 | 0 |
| Home / mobile | 87 | 100 | 96 | 92 | 4041 | 0.000 | 88 |
| NFT detail / desktop | 99 | 100 | 96 | 91 | 995 | 0.013 | 0 |
| NFT detail / mobile | 88 | 100 | 96 | 91 | 3815 | 0.016 | 36 |

Final report inputs are the three `home-final-<profile>-*.report.{html,json}`
files and the three `nft-detail-<profile>-*.report.{html,json}` files in
`reports/lighthouse/2026-11-11/`. The earlier Home reports are retained as
pre-accessibility-fix evidence and are not used for the final medians.

The Lighthouse command used `--only-categories=performance,accessibility,best-practices,seo`,
`--chrome-flags="--headless=new"`, and either `--preset=desktop` or
`--form-factor=mobile`. `lighthouse.config.js` and
`lighthouse.desktop.config.js` preserve the category and output configuration
for repeatable local audits.

This was a local HTTP preview. The remaining Best Practices/SEO deductions
include conditions that must be rechecked in the public HTTPS deployment,
such as robots and browser-console behavior. No score from this document is a
claim about the deployed site.
