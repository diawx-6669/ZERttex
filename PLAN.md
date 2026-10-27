# Saryarqa Go — build plan

ZERTTEX Hackathon 2026 · Stage 1 · Case 1 "Technology Product".
Prototype for the fictional company **Saryarqa Routes** (Astana) targeting Chinese-speaking independent travelers.

Rule of the build: **skeleton → full user journey → polish.** A working end-to-end flow beats extra features.

## Phase 0 — Skeleton (≈40 min)
- [x] Vite + React 18 + TypeScript + Tailwind, `vite-plugin-singlefile` → `dist/index.html`
- [x] Design tokens (midnight / sand / turquoise / gold) in CSS variables, light + dark via `prefers-color-scheme`
- [x] Hash router (`#/`, `#/tours`, `#/tour/:id`, `#/plan`, `#/ask`, `#/trust`, `#/book`, `#/trip`, `#/postcard`, `#/impact`, `#/about`)
- [x] App context: language (EN / 中文), large text, booking draft, confirmed booking, toasts
- [x] Header (sticky, mobile drawer, EN/中文 toggle, A+), footer with the 5-label legend
- [x] `Tag` component with exactly 5 label types: Case fact · Verified source · Proposal · Demo data · Needs confirmation

## Phase 1 — Data and logic (`src/data`, `src/lib`)
- [x] `tours.ts`: 4 sample tours, EN + 中文 names/taglines, 4 inclusion groups, day plan, packing, audio stops
- [x] `guides.ts`: 3 sample profiles ("Sample profile · not a real person")
- [x] `i18n.ts`: every UI string for header, home, tours, detail, booking, concierge, trust
- [x] `budget.ts`: year-1 budget = exactly <!--m:cap-->20,000,000<!--/m--> KZT (case limit, one config)
- [x] `concierge.ts`: keyword intents EN + 中文, language auto-detect, "I won't guess" fallback
- [x] `tripBuilder.ts`: rules-based itinerary with Almaty↔Astana↔Turkestan transfers, length check
- [x] `paybackModel.ts`: 48-month cumulative cash, base + downside (×0.7)
- [x] `qr.ts`: deterministic decorative QR-like pattern (labeled "not scannable")
- [x] `speech.ts`: Web Speech API wrapper with graceful fallback

## Phase 2 — Full user journey (the closed loop)
DISCOVER → PLAN → VERIFY → BOOK → TRAVEL → SHARE → back to DISCOVER
- [x] Home: hero SVG landscape, 6-step loop strip, "Four complaints, four answers", tour cards, market evidence
- [x] Tours list + tour detail (inclusions, itinerary, packing checklist, audio guide, ask button)
- [x] Trip builder → prefilled booking
- [x] Concierge chat (chips, aria-live, action buttons, manager handoff)
- [x] Trust center (guide video slideshow, profiles, video-call request, checklist, refund, 112)
- [x] Booking 3 steps + validation + declined payment + confirmation code
- [x] My trip: timeline + advance time, family sharing, weather/road demo + reschedule
- [x] Postcard: photos via FileReader, 4:5 canvas-like card, QR placeholder, referral link
- [x] Impact: Gantt, MVP vs later, budget table, payback sliders + SVG chart, KPIs, risks, metrics
- [x] About: case facts table + evidence cards with sources

## Phase 3 — Polish and verification
- [x] 375 px, no horizontal scroll; dark mode; reduced motion; focus states
- [x] `npm run build` clean (tsc + vite)
- [x] Playwright run-through of the acceptance checklist + screenshots
- [x] README.md, REPORT_NOTES.md, REPORT.md (full English report draft)

## Decisions taken without asking
- Tailwind v3 (stable config, works with singlefile build).
- No router library: a 40-line hash router is enough and keeps the bundle small.
- Postcard is rendered in the DOM (SVG + photo), and the "Download" button exports PNG through a `<canvas>` — still 100 % in the browser.
- Booking "today + 7 days" rule uses the device date.
- Currency: KZT is the source of truth; USD/CNY are indicative with "Demo rate" tags.
