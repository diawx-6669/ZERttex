# Saryarqa Go — Discover Kazakhstan. Book with confidence.

Hackathon prototype for **ZERTTEX Hackathon 2026 · Stage 1 · Case 1 "Technology Product"**.
Saryarqa Routes (fictional case company, Astana) wants 30% of its travelers to come from abroad within 24 months.
Saryarqa Go is the international booking app that gets them there, starting with Chinese-speaking independent travelers.

One closed loop, not a pile of features:

```
DISCOVER → PLAN → VERIFY → BOOK → TRAVEL → SHARE ─┐
   ▲                                               │
   └──────── the shared postcard brings a friend ──┘
```

## Run it

| What | Command |
|---|---|
| Open without installing anything | double-click **`dist/index.html`** (single file, works offline except Google Fonts) |
| Install | `npm install` |
| Dev server | `npm run dev` → http://localhost:5173 |
| Production build (single file) | `npm run build` → `dist/index.html` |
| Preview the build | `npm run preview` |
| Type-check only | `npm run typecheck` |
| Acceptance test (needs Playwright + Chromium) | `npm run test:e2e` → writes `screenshots/` |

Hash routes work on any static host: `#/tours`, `#/tour/kolsai`, `#/plan`, `#/ask`, `#/trust`, `#/book`, `#/trip`, `#/postcard`, `#/impact`, `#/about`.

## What works for real (in the browser)

- **Tours** with a 4-group "What's included" breakdown (Included / Optional extra / Not included / Not yet confirmed), day-by-day itinerary and a tickable packing list.
- **3-step booking** with real inline validation (date ≥ 7 days ahead, 1–12 travelers, name, email, country, guide language, payment method, policy checkbox), multi-tour bookings, live total in KZT with indicative USD and CNY.
- **Declined-payment path** (checkbox) with retry, and a success screen with a booking code like `SG-7KQ2`.
- **Bilingual concierge**: language auto-detect (Chinese characters → 中文), ~16 intents, tour-aware answers, action buttons, "I won't guess" fallback and a manager hand-off form.
- **Trip builder**: rules-based; arrival + real tour days + Almaty/Turkestan/Astana transfers + interest-based city days; error when tours don't fit; cost estimate; one click into a prefilled booking.
- **Audio guide** via the browser Web Speech API (`zh-CN` / `en-US`), with a text fallback when no voice exists.
- **Trust Center**: animated guide intro, 3 sample guide profiles, video-call request, verification checklist, refund rules, emergency number.
- **My trip**: timeline with "Advance demo time", family-sharing switch (off by default, copyable link, stop button), weather/road simulator with reschedule request.
- **Postcard**: 1–4 photos read with `FileReader` (never uploaded), 4:5 layout for Xiaohongshu / WeChat Moments / Instagram, decorative QR, copyable referral link, "see what your friend sees" back to step 1.
- **Impact page**: 12-week Gantt, year-1 budget (exactly 20,000,000 KZT), live payback model with 3 sliders and an SVG chart (base: month 32, downside: month 44 at defaults).
- EN / 中文 toggle and A+ larger text (saved in `localStorage`), light + dark theme, works at 375 px, keyboard-operable, `aria-live` chat.

## What is simulated (and labelled as such)

| Area | In the prototype | Label |
|---|---|---|
| Payments | No money moves; striped **TEST MODE** banner; no card-number fields, no passport data | TEST MODE |
| Alipay / WeChat Pay | Selectable, marked "Planned · requires provider approval" | Proposal |
| Concierge, trip builder | Keyword / rules logic, not an LLM | "Demo · scripted, not live AI" |
| Tour prices and details | Made up for the demo | Demo data |
| Guides | Sample profiles, not real people | Demo data · Sample profile |
| Weather and road | 4 simulated conditions | Demo data |
| Licence, registration, insurance | Not claimed | Needs confirmation |
| Refund guarantee, family sharing, referral discount | Team proposals | Proposal |

Every label in the UI is one of exactly five: **Case fact · Verified source · Proposal · Demo data · Needs confirmation**. The legend is in the footer of every page.

## What production would need

1. **Backend + database** (bookings, tours, availability, guides, users) with an admin panel for managers.
2. **Payment provider hosted checkout + webhooks** (card first; Alipay / WeChat Pay after provider approval); escrow-style payout after the tour starts.
3. **LLM concierge with retrieval** over verified tour data only, with refusal rules, logging and human hand-off.
4. **Admin panel** for tours, inclusions, "not yet confirmed" items, guide availability and reschedule approvals.
5. **Privacy and legal review** (Kazakhstan + China cross-border data rules), cookie/consent, data retention.
6. Live weather/road feeds, offline audio downloads, GPS-based family sharing (opt-in), OTA listings (Trip.com / Klook).

## Where things are

```
src/
  data/        tours.ts · guides.ts · i18n.ts · facts.ts · budget.ts · types.ts
  lib/         concierge.ts · tripBuilder.ts · paybackModel.ts · qr.ts · speech.ts · router.ts · format.ts
  components/  Layout.tsx (header, footer legend, loop strip) · Tag.tsx · Scene.tsx (SVG art) · TourParts.tsx · Icon.tsx
  pages/       Home · Tours · TourDetail · Plan · Ask · Trust · Book · Trip · Postcard · Impact · About
  state.tsx    React context: language, text size, booking draft, confirmed booking, toasts
dist/index.html   single-file build
screenshots/      screens captured by the automated acceptance run
PLAN.md · REPORT.md · REPORT_NOTES.md
```

Tech: React 18, TypeScript (strict), Vite 6, Tailwind CSS 3, `vite-plugin-singlefile`. No backend, no API keys, no runtime network calls except Google Fonts.

## Verification

An automated Playwright run walks the full acceptance checklist (66 checks: every loop step, validation, decline/success, Chinese answers, 8-day Kolsai + Burabay plan with the Astana transfer, 20,000,000 KZT total, payback months 32 / 44, no overflow at 375 px on all 12 routes, dark mode, no JS errors). Result: **66 / 66 passed**.
