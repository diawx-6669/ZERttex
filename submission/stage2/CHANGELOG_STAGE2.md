# Saryarqa Go · What changed since Stage 1, and why

The core idea is unchanged: one closed loop (Discover → Plan → Verify → Book → Travel → Share) that answers the four complaints of foreign guests. Stage 2 makes it sharper, more honest and easier to demo.

## Money: one source of truth
- **Budget stays exactly 20,000,000 KZT** (organizers' correction). All money assumptions now live in one config, `src/data/budget.ts`: lines, margin, running cost, ramp, case facts. The Impact page, KPI tiles, chart, report generators, the Cost and Payback Sheet and the Markdown docs all read from it. The build **fails** if the lines do not add up to 20,000,000.
  *Why:* judges saw different numbers in different places risk; now one edit changes everything.
- Results are unchanged from Stage 1: payback **month 32** (base) and **month 44** (30% lower results), break-even **1,516** travelers.
- New **Staged spending** note (Proposal): Gate 1 = 14,500,000 KZT for the MVP and pilot; Gate 2 = 5,500,000 KZT (marketing, contingency) only if pilot metrics are met. *Why:* a cap with a stop point is more realistic for a 9-person company.
- New **Cost_Payback_Sheet.xlsx** (live formulas, recalculated independently in LibreOffice to the same results) and a one-page **Cost_Payback_Sheet.pdf**.

## Scope made visible
- Every page and key section carries a pill badge **In MVP** or **Phase 2**, from the same `inMvp` / `later` lists as the Impact page. *Why:* shows what the 12 weeks really deliver.

## Live AI, safely (optional)
- A small Cloudflare Worker calls Claude Haiku 5.5. The API key stays on the server; the website only knows the Worker URL.
- The model only gets our verified data with its labels and may not invent prices, availability, licences or safety guarantees; answers are JSON, re-checked by the server and by the app.
- Uses: concierge answers (same chat, chips and handoff), "Describe your trip" (the AI only reads preferences; the itinerary still comes from the rules-based builder), caption ideas for Xiaohongshu, and reply drafts in the new **manager inbox**.
- If the AI is missing, fails, or takes more than 8 seconds, the app silently uses the scripted logic. A footer switch forces scripted mode on stage. The app shows "Live AI · beta" or "Scripted demo", and every AI output is tagged.
- AI cost (about $0.2–1.1 per 1,000 chats, Needs confirmation) fits inside the existing "Hosting, AI usage, maintenance" line; no new budget line.

## Operator side
- New **Manager inbox** (`#/manager`, "For Saryarqa Routes staff · demo"): handoff questions from the concierge, a Russian summary and a reply draft in the traveler's language. Nothing is sent automatically: the manager must fill placeholders and confirm the checks. *Why:* shows the company saves staff time on repeat questions (to be measured in the pilot).

## Share step is now real
- The postcard QR is a **real, scannable QR** that opens the tour page with the friend's referral code (`#/tour/<id>?ref=<code>`). The "not scannable" label is gone.
- **Download PNG** (1080 × 1350) made in the browser.
- **Print-ready A6 postcards** (`postcards.pdf`, 148 × 105 mm + 3 mm bleed, one per tour) with headline, QR and credit line.

## Demo safety
- Offline photo pipeline: `npm run photos:offline` (or the manual GitHub Action "Fetch offline photos") bundles the 12 credited Wikimedia Commons photos into the single-file build, so photos show without Wi-Fi. *Status: still to run — Wikimedia was blocked in the build environment.*
- Scripted mode is always available; `docs/index.html` works as an offline single file.

## Evidence slot
- `src/data/interviews.ts` is an **empty** list with a "What travelers told us" block on Home and About that stays hidden until the team adds real, consented interview quotes. No sample data.

## Tests
- Automated acceptance run: 144 checks pass, 1 skipped (offline photos, until the files are downloaded). New checks decode the QR codes with a QR library (screen, PNG, print page, PDF), test the AI paths with a mocked server (valid answer, broken JSON, server error, timeout, stage switch), and check 375 px and dark mode on new screens. The Worker has its own 21 checks against a mock Claude API.
