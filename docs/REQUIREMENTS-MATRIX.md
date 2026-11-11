# Requirements Matrix

Keep this intentionally compact. Split rows only when implementation/testing needs separate evidence.

| ID | Requirement | Priority | Owner | Acceptance | Test/Evidence | Status |
|---|---|---|---|---|---|---|
| EL-01 | Mandatory stack used effectively | Eliminatory | Orchestrator | Every required technology participates in real behavior | package/config, unit tests, E2E and Lighthouse local run | Verified locally (2026-11-11) |
| EL-02 | Main flows are functional, not visual-only | Eliminatory | All | API/mock state drives UI results | Playwright 40/40, desktop + mobile | Verified locally (2026-11-11) |
| EL-03 | Purchase only succeeds after simulation confirmation | Eliminatory | Core | confirmed receipt only after order confirmed | purchase E2E: confirmed, declined and idempotent timeout recovery | Verified locally (2026-11-11) |
| EL-04 | User/session isolation | Eliminatory | Core | no private data survives user switch/logout | account E2E: private favorites and logout clearing | Verified locally (2026-11-11) |
| EL-05 | Realtime passes through Socket.IO client | Eliminatory | Core | UI reacts to MSW Socket.IO event | foundation/realtime E2E in desktop + mobile | Verified locally (2026-11-11) |
| EL-06 | Executable Playwright tests | Eliminatory | QA | clean checkout can execute E2E suite | 40/40 Playwright passed | Verified locally (2026-11-11) |
| CAT-01 | Catalog state in URL | Critical | Core+UI | search/filter/sort/page survive refresh/history/direct URL | Playwright: page 2 navigation, direct `?page=3`, refresh and back/forward; 36 deterministic fixtures / 4 pages | Verified (Cycle 2) |
| CART-01 | Persistent cart + guest/login merge | Critical | Core | refresh/login preserve correct items | purchase E2E | Verified locally (2026-11-11) |
| PAY-01 | Exact ETH + authoritative quote | Critical | Core | no JS float money logic; revalidation before order | Vitest decimal assertions + checkout E2E | Verified locally (2026-11-11) |
| ORD-01 | Idempotent order + recovery | Critical | Core | repeat same attempt returns same order; changed payload conflicts | Vitest + Axios/MSW timeout-recovery E2E | Verified locally (2026-11-11) |
| RT-01 | Versioned realtime + reconnect reconciliation | Critical | Core | duplicate/old ignored; reconnect refetches REST | version-gate unit tests + MSW Socket.IO E2E | Verified locally (2026-11-11) |
| UX-01 | Figma fidelity + 390/768/1440 | High | UI | no unintended overflow; responsive frames | Playwright catalog/detail no-overflow checks at 390/768/1440; fresh Figma screenshot comparison blocked by MCP rate limit | Partially verified (responsive); Figma comparison pending quota |
| A11Y-01 | Keyboard/focus/labels/feedback | High | UI+QA | main flows usable by keyboard | Accessible labels and state/error controls exercised in Playwright; manual keyboard audit remains | Partially verified |
| PERF-01 | Lighthouse reporting | High | QA | home/detail audited mobile+desktop x3; medians recorded | `docs/LIGHTHOUSE-2026-11-11.md` + 24 final HTML/JSON reports | Verified locally (2026-11-11) |
| DEP-01 | Public reproducible deploy | Critical | QA | direct routes, refresh, mocks and realtime work publicly | production-preview direct-route + MSW/Socket.IO passed; public deploy pending authorization | Pending public deploy |
