# Functional UI foundation — Home and NFT catalog

> The current screens validate navigation, REST/MSW, Socket.IO, session, cart,
> checkout, order, profile, and wallet flows. They are not the final visual
> implementation: Figma fidelity work and visual validation remain a separate
> follow-up.

## Scope completed in the supplied working copy

- Replaced the foundation-only `/` screen with the Kurio Home and functional NFT catalog.
- Kept the original technical probe accessible at `/validation` (REST, Socket.IO and shadcn check).
- Added a lightweight NFT detail page so catalog cards do not lead to a dead link. Checkout, account, wallet, cart, and order flows are functional through the mock API, while their visual treatment remains provisional.
- The Home uses the documented Figma copy `jH7WpcwMcBY8cJnQfVk1gE`: desktop `2:2` (1440px), mobile `14:5226` (414px). The Figma source was read only and never modified.
- Layout, wording and design palette derive from the Figma's desktop/mobile Home: ink `#140D0A`, surface `#241612`, primary copper `#D28A4C`, accent `#E89B55`, foreground `#F5F1EB`, secondary `#CFB28C`, Roboto Mono-style typography.
- Responsive at 390px, 768px and 1440px by fluid grids/CSS breakpoints; mobile has the search/filter control and bottom navigation.
- Catalog data comes **only** from `marketplaceApi.listNfts` (Axios + MSW), via TanStack Query; URL state is TanStack Router `validateSearch` + `navigate` for query, category, sort, availability, page. Debounced query updates and AbortSignal support avoid stale responses.
- Empty, loading (reduced-motion-aware shimmer), transient error and retry states are provided.
- Added desktop and mobile catalog Playwright scenarios; existing REST/Socket.IO foundation E2E scenarios now run at `/validation`.

## Design/data differences to review

- The Figma displays collection and network filters not represented by the existing `NftListParams` contract. Home provides only working filter controls corresponding to existing API fields (three categories and availability) instead of fake UI actions. Figma labels are adapted to the three actual category enums.
- The mock database contains six seed NFTs named Jaguar Prime, Toucan Signals, etc., while the design depicts Emerald Ape, Sage Nomad, etc. Seed data and IDs have deliberately **not been changed** to avoid breaking the foundation's unit tests and purchase business rules.
- The mock's `imageUrl` for seed NFTs points to non-existent `/assets/nft-*.png`. A clearly isolated presentation fallback maps those six demo IDs to four authentic existing Figma exports in `public/assets/figma`. The mapping should be replaced once exact individual design assets are exported and the fixture catalog is aligned in a separate approved change.
- The full editorial/blog section, certain marketing tiles, missing icons, several supporting artwork variants, and exact Figma font files were not supplied among the four downloaded assets. Do not mark the page as visually pixel-perfect yet. No temporary Figma asset URLs are embedded in the runtime.
- The detail screen displays real API data and sends purchase-related actions through the mock API; its final visual treatment is pending.

## Verification status

- Local verification completed on 2026-11-11: typecheck, lint, Vitest (20/20), production build, and Playwright (40/40) passed. Lighthouse evidence is recorded in `docs/LIGHTHOUSE-2026-11-11.md`.

Repeat the checks after the planned visual implementation:

```powershell
npm.cmd ci
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run test
npm.cmd run build
npm.cmd run test:e2e
```

If TanStack Router generates `src/routeTree.gen.ts` on startup/build, retain the generated version. Do not make manual changes to this generated file.

## Safety and Git

No source Figma modifications, Git commits, pushes, PRs, or changes to `.git/info/exclude` were performed. `AGENTS.md`, `.ai/`, `.codex/`, and `docs/STATUS.md` were not altered. Only files listed in the patch archive were changed.
