# Architecture

Status: functional foundation implemented; final Figma visual fidelity remains pending.

## Build and routing
- React + TypeScript + Vite.
- TanStack Router with file-based routing.
- Route search params are the source of truth for catalog search, filters, sort and page.
- Private routes validate/recover session and preserve intended navigation for resume.

## Remote state
- TanStack Query owns API-derived data.
- Query keys include every parameter that changes the response.
- Private query keys also include the authenticated user identity.
- Use cancellation/AbortSignal where applicable and prevent stale responses from replacing newer state.
- Document final `staleTime`, retry and invalidation policy after real behavior is implemented.
- Foundation policy: queries use a 30-second `staleTime`, retry once, and do not
  refetch on window focus. Feature-specific policies and invalidation rules remain
  pending with their API contracts.

## HTTP
- One centralized Axios client.
- Typed transport contracts.
- Session context added centrally.
- Consistent error mapping.
- No mock branching inside components/hooks.

## Money
- ETH values cross transport boundaries as decimal strings.
- Use exact decimal arithmetic (`decimal.js` recommended) for subtotal, discounts, network fee and total.
- Define one rounding policy and formatting helper.
- Checkout uses the quote returned by the mock API as authoritative.
- Order receipt stores an immutable pricing snapshot.

## Mock backend
MSW is the simulated network/backend layer.

Use one coherent mock data store for:
- users/session
- NFTs/editions
- favorites
- carts
- coupons/quotes
- orders/receipts
- profiles
- wallets
- scenario state

Persistence is allowed where refresh behavior requires it. Provide a deterministic full reset.

Expose deterministic mock-control endpoints for Playwright/development scenarios. The application UI must not use them for business behavior.

## Session isolation
- Persist only a simulated session identifier/token needed to recover the session.
- Do not persist plaintext passwords.
- Store fixture/user password verification material as a derived hash for the simulation and document that it is not production authentication.
- Private Query keys are scoped by user.
- Logout/user switch removes private queries, cancels in-flight private requests, disconnects old subscriptions and reconnects only for the new session.

## Cart
Identity key: `nftId + editionId`.

Guest cart persists across refresh.
On login:
- merge guest and authenticated cart according to a documented policy;
- cap/validate quantities against current availability;
- preserve the resulting cart on refresh.

Socket updates may mark price/availability as changed, but checkout must revalidate through the quote API.

## Orders and idempotency
Order create accepts `Idempotency-Key`.

Mock store keeps:
- key
- canonical request fingerprint
- order id
- order snapshot
- current status

Rules:
- new key => create once;
- same key + same fingerprint => return existing order;
- same key + different fingerprint => 409 conflict;
- timeout-after-create scenario persists the order before simulating the lost response.

Persist the active checkout attempt key and payload until a terminal result is recovered.

Statuses: pending, confirmed, declined.
Confirmed and declined are terminal.

## Realtime
Use `socket.io-client` in application code.

Use MSW WebSocket support with `@mswjs/socket.io-binding` for the mock transport.

Required events:
- `nft.updated`
- `order.updated`

Event envelope should include:
- stable event id
- resource id
- resource version
- payload

Client tracks latest resource version / processed ids:
- ignore duplicates;
- ignore older versions;
- never regress state;
- clean listeners;
- on reconnect, revalidate active resources through REST.

Socket effects update/invalidate TanStack Query; REST remains the reconciliation source of truth.

### Foundation mock transport
- Development and E2E start MSW before React renders, therefore before any Socket.IO
  client is created.
- The proof connection uses `socket.io-client` with WebSocket-only transport and the
  default Socket.IO namespace. MSW's `ws.link('*')` receives the WebSocket and
  `@mswjs/socket.io-binding` decodes/encodes the Socket.IO event.
- The binding does not provide full Socket.IO parity (notably rooms, namespaces and
  broadcasting). These are intentionally outside the foundation spike; later events
  must stay in the documented supported subset or use an integration with the needed
  capability.

## Testing
Playwright uses deterministic reset + scenario controls.

Highest-priority flows:
1. URL search/filter/sort/page persistence.
2. Login/session expiration/user switch isolation.
3. Cart persistence and coupon.
4. Complete confirmed purchase.
5. Declined purchase.
6. Repeated click + timeout + idempotent recovery.
7. `nft.updated` during cart/checkout and stale quote reconfirmation.
8. Duplicate/old event handling and pending-order recovery.
9. Keyboard/focus and skeleton/error recovery.

Visual baselines: home, NFT detail, cart, checkout.

## Deployment
Deploy an optimized Vite SPA with history fallback.
Mocks and Socket.IO simulation must work in the public build.
Direct route access and refresh must resolve correctly.

## Cycle 1 mock API implementation

### Contracts and transport
- `src/api/contracts/marketplace.ts` is the shared transport-contract module
  for NFTs/editions, list parameters/pages, sessions, profiles, wallets,
  favorites, carts, coupons, quotes, orders/receipts and realtime envelopes.
- `src/api/marketplace-api.ts` is the feature-facing REST client and uses the
  central Axios instance. ETH values stay 18-place decimal strings; `decimal.js`
  is used by `src/shared/lib/money.ts` rather than JavaScript float arithmetic.

### Mock store and business policy
- `MockDatabase` is the single MSW source of truth: six varied NFTs, two users,
  profiles, wallets, favorites, carts, quotes, orders and sessions live in one
  coherent state object. Browser localStorage persistence restores refreshes;
  reset restores the deterministic fixture exactly.
- Password fixture material is a non-production derived string, never plaintext.
  Private records are keyed by session user id; guest carts use `guest:<id>`.
- Quotes recompute current catalog data and carry a fingerprint, exact totals and
  a five-minute validity. `Idempotency-Key` stores a canonical payload
  fingerprint. Equal retries recover one order; differing payloads return 409.
  Timeout-after-create persists before the simulated lost response. Receipts are
  immutable copies. Confirmed orders decrement stock/remove purchased quantities;
  declined orders preserve carts.

### REST, scenarios and realtime
- MSW implements `/api/auth`, `/api/nfts`, `/api/favorites`, `/api/cart`,
  `/api/coupons/validate`, `/api/quotes`, `/api/orders`, `/api/profile` and
  `/api/wallets`, with 401/404/409/422 and simulated network/500 responses.
- Development/E2E-only mock controls provide reset, scenario patching, fixture
  sessions and catalog mutations. Scenarios cover empty data, latency, network
  and HTTP failures, expired session, registration conflict, coupons, catalog
  changes, pending/confirmed/declined orders and timeout recovery.
- Database mutations emit typed, versioned `nft.updated` and user-scoped
  `order.updated` through the existing `socket.io-client`/MSW binding. The
  `RealtimeEventGate` ignores duplicate ids and stale versions; subscriptions
  clean up listeners and request REST reconciliation after reconnect. Binding
  support remains limited to its default namespace/client event subset.
