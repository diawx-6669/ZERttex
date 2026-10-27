# Saryarqa Go — Discover Kazakhstan. Book with confidence.

Hackathon prototype for **ZERTTEX Hackathon 2026 · Final (Stage 2) · Case 1 "Technology Product"**. Stage 2 changes: [`submission/stage2/CHANGELOG_STAGE2.md`](submission/stage2/CHANGELOG_STAGE2.md).
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
| Download real destination photos (needs network to Wikimedia) | `npm run photos` (then `npm run build`) |
| Build the ZERTTEX submission (PDFs + Google Docs-ready DOCX) | `npm run submission` → `submission/` |
| Rebuild the Word report from `REPORT.md` | `npm run report:docx` → `docs/Saryarqa_Go_Report.docx` |
| Refresh every money number in the Markdown docs from `src/data/budget.ts` | `npm run sync:money` |

Hash routes work on any static host: `#/tours`, `#/tour/kolsai`, `#/plan`, `#/ask`, `#/trust`, `#/book`, `#/trip`, `#/postcard`, `#/impact`, `#/about`.

## What works for real (in the browser)

**Comfort and navigation**
- Concierge in a **slide-in drawer on every page** (floating button on desktop, "Ask" tab on phones); the conversation is kept when you move between pages.
- **Bottom tab bar on phones** (Tours · Plan · Ask · Trust · My trip), sticky price + "Book" bar on tour pages, back-to-top button.
- **Tours page filters** (start city, interest, length) and sorting, with a live "N tours" count.
- **Sticky section tabs** on tour pages (What's included · Day by day · Audio guide · Packing) that follow the scroll.
- **Interactive route map**: places projected from real coordinates, tap a pin for a tour card; the trip builder lights up your selected places.
- Home: rotating destination card deck, company facts counter, scroll-in animations (all off with reduced motion).

**Core features**

- **Tours** with a 4-group "What's included" breakdown (Included / Optional extra / Not included / Not yet confirmed), day-by-day itinerary and a tickable packing list.
- **3-step booking** with real inline validation (date ≥ 7 days ahead, 1–12 travelers, name, email, country, guide language, payment method, policy checkbox), multi-tour bookings, live total in KZT with indicative USD and CNY.
- **Declined-payment path** (checkbox) with retry, and a success screen with a booking code like `SG-7KQ2`.
- **Bilingual concierge**: language auto-detect (Chinese characters → 中文), ~16 intents, tour-aware answers, action buttons, "I won't guess" fallback and a manager hand-off form.
- **Trip builder**: rules-based; arrival + real tour days + Almaty/Turkestan/Astana transfers + interest-based city days; error when tours don't fit; cost estimate; one click into a prefilled booking.
- **Audio guide** via the browser Web Speech API (`zh-CN` / `en-US`), with a text fallback when no voice exists.
- **Trust Center**: animated guide intro, 3 sample guide profiles, video-call request, verification checklist, refund rules, emergency number.
- **My trip**: timeline with "Advance demo time", family-sharing switch (off by default, copyable link, stop button), weather/road simulator with reschedule request.
- **Postcard**: 1–4 photos read with `FileReader` (never uploaded), 4:5 layout for Xiaohongshu / WeChat Moments / Instagram, real scannable QR to `#/tour/<id>?ref=<code>`, Download PNG (1080 × 1350), "Suggest a caption" (3 中文 + 3 EN), print-ready A6 postcards at `#/print/postcards`, copyable referral link, "see what your friend sees" back to step 1.
- **Impact page**: 12-week Gantt, year-1 budget (exactly <!--m:cap-->20,000,000<!--/m--> KZT, the case limit; one config in `src/data/budget.ts`, build fails if lines ≠ cap), live payback model with 3 sliders and an SVG chart (base: month <!--m:pbBase-->32<!--/m-->, 30% lower results: month <!--m:pbDown-->44<!--/m--> at defaults), break-even <!--m:breakEven-->1,516<!--/m--> travelers.
- EN / 中文 toggle and A+ larger text (saved in `localStorage`), light + dark theme, works at 375 px, keyboard-operable, `aria-live` chat.

## What is simulated (and labelled as such)

| Area | In the prototype | Label |
|---|---|---|
| Payments | No money moves; striped **TEST MODE** banner; no card-number fields, no passport data | TEST MODE |
| Alipay / WeChat Pay | Selectable, marked "Planned · requires provider approval" | Proposal |
| Concierge, trip builder, captions, manager drafts | Scripted rules by default. With `VITE_AI_ENDPOINT` set, live Claude (Haiku 5.5) through `worker/`, grounded only on verified data; silent fallback to scripted on any error or > 8 s; footer switch "Scripted demo only" | "Live AI · beta" or "Scripted demo" badge; every AI output tagged "AI-generated" |
| Manager inbox (`#/manager`) | Handoffs stored in this browser only; sending is simulated and needs manager approval | "For Saryarqa Routes staff · demo", seed rows Demo data |
| Tour prices and details | Made up for the demo | Demo data |
| Guides | Sample profiles, not real people | Demo data · Sample profile |
| Weather and road | 4 simulated conditions | Demo data |
| Licence, registration, insurance | Not claimed | Needs confirmation |
| Refund guarantee, family sharing, referral discount | Team proposals | Proposal |

Every label in the UI is one of exactly five: **Case fact · Verified source · Proposal · Demo data · Needs confirmation**. The legend is in the footer of every page.

## Stage 2 additions

- **One money config** `src/data/budget.ts` (cap 20,000,000 KZT, build guard), staged spending Gate 1 / Gate 2, `npm run sync:money` for the docs, `npm run cost-sheet` → `submission/stage2/Cost_Payback_Sheet.xlsx` (live formulas) + `.pdf` (one A4 page).
- **In MVP / Phase 2** badges on pages and sections.
- **Live AI (optional)**: `worker/` Cloudflare Worker, see [`worker/README.md`](worker/README.md). `npm run grounding` rebuilds the verified data the AI may use.
- **Manager inbox** `#/manager`, **real QR**, **A6 postcards** (`npm run postcards`), **offline photos** (`npm run photos:offline`), empty **interviews** slot (`src/data/interviews.ts`).
- Stage 2 deliverables in `submission/stage2/`: Cost and Payback Sheet, SLIDES_CONTENT, DEMO_SCRIPT, AI declaration draft, changelog, postcards.

## What production would need

1. **Backend + database** (bookings, tours, availability, guides, users) with an admin panel for managers.
2. **Payment provider hosted checkout + webhooks** (card first; Alipay / WeChat Pay after provider approval); escrow-style payout after the tour starts.
3. **LLM concierge with retrieval** over verified tour data only, with refusal rules, logging and human hand-off.
4. **Admin panel** for tours, inclusions, "not yet confirmed" items, guide availability and reschedule approvals.
5. **Privacy and legal review** (Kazakhstan + China cross-border data rules), cookie/consent, data retention.
6. Live weather/road feeds, offline audio downloads, GPS-based family sharing (opt-in), OTA listings (Trip.com / Klook).

## Design

Cool neutral paper and near-black ink with one accent (the sky blue of the Kazakh flag, deepened for contrast). Archivo for headlines (slightly expanded, like a travel poster), Instrument Sans for text, Phosphor icons. One shape system: controls 10 px, containers 16 px, honesty labels 4 px. No uppercase micro-labels, no decorative dots, no em-dashes; sections use different layouts (editorial list, asymmetric tour grid, big-number row, map split). Light and dark themes follow the system setting.

## Photos (offline-safe)

The app shows 12 freely licensed Wikimedia Commons photos (listed with author and licence in `src/data/commonsPhotos.json` and on About → Photo credits) and falls back to the hand-drawn SVG scenes when a photo cannot load.

**Before the live pitch, bundle the photos so they work with no Wi-Fi:**

```bash
npm run photos:offline   # downloads the 12 files → src/assets/photos/<tour>-<n>.jpg (≤ 1600 px, ≤ 250 KB) + photoCredits.json
npm run build            # inlines them into dist/index.html and docs/index.html
node tests/acceptance.cjs   # "Offline: real photos on /tour/…" checks now run instead of SKIP
```

No time to run it locally? GitHub → Actions → **Fetch offline photos** → Run workflow on your branch: it downloads, rebuilds and commits the files.
Already have the files? `node scripts/photos-offline.cjs --from <folder>` resizes and credits them.

- Downloaded files take priority; any photo not downloaded yet is loaded from Commons at runtime.
- Every photo needs a credit; files without one in `photoCredits.json` are ignored.
- `npm run photos` (older script) searches Commons for other free photos; review every one before showing it.

## Where things are

```
src/
  data/        tours.ts · guides.ts · i18n.ts · facts.ts · budget.ts · photos.ts · photoCredits.json · types.ts
  lib/         concierge.ts · tripBuilder.ts · paybackModel.ts · qr.ts · speech.ts · router.ts · format.ts
  components/  Layout.tsx (header, footer, loop strip, tab bar) · Chat.tsx (shared concierge + drawer) · Media.tsx (photo/SVG, gallery, lightbox)
               RouteMap.tsx · Showcase.tsx (card deck, count-up) · Tag.tsx · Scene.tsx (SVG art) · TourParts.tsx · Icon.tsx
  pages/       Home · Tours · TourDetail · Plan · Ask · Trust · Book · Trip · Postcard · Impact · About
  state.tsx    React context: language, text size, booking draft, confirmed booking, toasts
dist/index.html   single-file build
screenshots/      screens captured by the automated acceptance run
scripts/fetch-photos.mjs · scripts/photos.config.json   photo download pipeline
docs/Saryarqa_Go_Report.docx · .pdf   the report as Word / PDF with screenshots (docs/img)
PLAN.md · REPORT.md · REPORT_NOTES.md
```

Tech: React 18, TypeScript (strict), Vite 6, Tailwind CSS 3, Phosphor icons, `vite-plugin-singlefile`. No API keys in the browser (the optional AI key lives only in the Worker), no runtime network calls except Google Fonts.

## Verification

An automated Playwright run walks the full acceptance checklist (155 checks, including Stage 2: QR decoding, mocked live AI with invalid JSON / errors / timeout, manager inbox, deliverables; every loop step, validation, decline/success, Chinese answers, 8-day Kolsai + Burabay plan with the Astana transfer, <!--m:cap-->20,000,000<!--/m--> KZT total, payback months <!--m:pbBase-->32<!--/m--> / <!--m:pbDown-->44<!--/m-->, no overflow at 375 px on all 12 routes, dark mode, chat drawer from any page, tours filters, map pins, phone tab bar, no JS errors). Result: **154 passed, 1 skipped** (offline photos run once the files are downloaded). `cd worker && npm test`: 21 Worker checks against a mock Claude API.
