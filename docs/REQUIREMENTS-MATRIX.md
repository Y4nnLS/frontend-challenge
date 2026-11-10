# Requirements Matrix

Keep this intentionally compact. Split rows only when implementation/testing needs separate evidence.

| ID | Requirement | Priority | Owner | Acceptance | Test/Evidence | Status |
|---|---|---|---|---|---|---|
| EL-01 | Mandatory stack used effectively | Eliminatory | Orchestrator | Every required technology participates in real behavior | package/config + exercised flow | Pending |
| EL-02 | Main flows are functional, not visual-only | Eliminatory | All | API/mock state drives UI results | E2E flows | Pending |
| EL-03 | Purchase only succeeds after simulation confirmation | Eliminatory | Core | confirmed receipt only after order confirmed | purchase E2E | Pending |
| EL-04 | User/session isolation | Eliminatory | Core | no private data survives user switch/logout | user-switch E2E | Pending |
| EL-05 | Realtime passes through Socket.IO client | Eliminatory | Core | UI reacts to MSW Socket.IO event | realtime E2E | Pending |
| EL-06 | Executable Playwright tests | Eliminatory | QA | clean checkout can execute E2E suite | test report | Pending |
| CAT-01 | Catalog state in URL | Critical | Core+UI | search/filter/sort/page survive refresh/history/direct URL | E2E | Pending |
| CART-01 | Persistent cart + guest/login merge | Critical | Core | refresh/login preserve correct items | E2E | Pending |
| PAY-01 | Exact ETH + authoritative quote | Critical | Core | no JS float money logic; revalidation before order | unit/E2E | Pending |
| ORD-01 | Idempotent order + recovery | Critical | Core | repeat same attempt returns same order; changed payload conflicts | E2E | Pending |
| RT-01 | Versioned realtime + reconnect reconciliation | Critical | Core | duplicate/old ignored; reconnect refetches REST | E2E | Pending |
| UX-01 | Figma fidelity + 390/768/1440 | High | UI | no unintended overflow; responsive frames | visual/manual | Pending |
| A11Y-01 | Keyboard/focus/labels/feedback | High | UI+QA | main flows usable by keyboard | E2E/manual | Pending |
| PERF-01 | Lighthouse reporting | High | QA | home/detail audited mobile+desktop x3; medians recorded | reports | Pending |
| DEP-01 | Public reproducible deploy | Critical | QA | direct routes, refresh, mocks and realtime work publicly | deploy verification | Pending |
