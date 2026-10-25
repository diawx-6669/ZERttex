# REPORT_NOTES — ready to paste into the English report

Labels used everywhere: **Case fact** · **Verified source** · **Proposal** · **Demo data** · **Needs confirmation**.

---

## 1. Product summary (3 sentences)

Saryarqa Go is a bilingual (English / Chinese) booking app that lets foreign travelers, starting with Chinese-speaking independent travelers, discover, plan, verify, book and pay for Saryarqa Routes' guided trips in three clear steps with a foreign card. It answers the four complaints foreign guests actually made (unclear booking, doubtful trust, foreign card failing, unknown inclusions) with one closed loop: Discover → Plan → Verify → Book → Travel → Share, where the shared postcard brings the next traveler back to Discover. The 12-week MVP fits inside the 20,000,000 KZT year-1 budget and, under stated assumptions, pays back in month 32 (base case) or month 44 (downside).

---

## 2. Complaint → feature

| What foreign guests said (Case fact) | Feature that answers it | Where in the prototype |
|---|---|---|
| "It is unclear how to book." | 3-step booking (trip → lead traveler → payment), live price, trip builder that prefills booking, bilingual concierge | `#/book`, `#/plan`, `#/ask` |
| "I am not sure the company is trustworthy." | Trust Center: meet-your-guide video, 5-minute video call before paying, honest verification checklist, refund guarantee, emergency info; family updates during the trip | `#/trust`, `#/trip` |
| "My foreign card does not work." | International card via provider-hosted checkout; Alipay and WeChat Pay planned after provider approval; KZT price with indicative USD / CNY | `#/book` step 3 |
| "I do not know what is included." | "What's included" in 4 groups (Included / Optional extra / Not included / Not yet confirmed) on every tour, repeated in the booking summary before payment | `#/tour/kolsai`, booking summary |

---

## 3. Features: MVP vs later

| Feature | MVP (12 weeks) | Later |
|---|---|---|
| EN / 中文 tour pages with "What's included" breakdown | ✅ | |
| 3-step booking, international card via hosted checkout | ✅ | |
| Alipay / WeChat Pay | | ✅ after provider approval |
| Concierge: scripted bilingual FAQ + human hand-off | ✅ | Live LLM with retrieval over verified tour data |
| Trust Center: guide videos, checklist, refund policy, video call request | ✅ | |
| Rules-based trip builder | ✅ | |
| My trip: timeline, daily check-ins, reschedule requests | ✅ | |
| Weather & road alerts | Manual operator alerts | Live weather / road feeds |
| Family updates | Check-in status sharing | GPS-based sharing (opt-in) |
| Audio guide EN / 中文 | Text-to-speech in browser | Offline pre-downloaded audio |
| Postcard + referral link | ✅ | Referral discount (Proposal) |
| Distribution | Own app/site, Xiaohongshu content | Trip.com / Klook listing |

---

## 4. 12-week MVP plan

| Weeks | Work | Output |
|---|---|---|
| W1–2 | Research & validation | 10+ interviews with Chinese-speaking travelers; apply to payment providers |
| W3–4 | UX + tour pages | Wireframes, EN / 中文 tour pages, design system |
| W5–7 | Booking + inclusions + concierge + trust | Core booking flow, Trust Center content, guide videos |
| W8–9 | Trip builder + checkout + weather / reschedule | Hosted checkout sandbox, reschedule workflow |
| W10–11 | Usability tests + payment-provider checks | 5–8 test sessions, provider due diligence |
| W12 | Pilot with real users | Limited launch, success metrics measured |

---

## 5. Year-1 budget (planning assumptions) — total exactly 20,000,000 KZT

| Item | Type | KZT | Share |
|---|---|---:|---:|
| Design & development | one-time | 8,000,000 | 40.0% |
| Localization EN / 中文 | one-time | 1,500,000 | 7.5% |
| Payment integration & testing | one-time | 1,500,000 | 7.5% |
| Trust content: guide videos, photos | one-time | 1,000,000 | 5.0% |
| Marketing & acquisition | recurring | 4,500,000 | 22.5% |
| Hosting, AI usage, maintenance | recurring | 1,500,000 | 7.5% |
| Pilot & support | recurring | 1,000,000 | 5.0% |
| Contingency | reserve | 1,000,000 | 5.0% |
| **Total** | | **20,000,000** | **100%** |

One-time: 12,000,000 KZT. Recurring + contingency: 8,000,000 KZT.

---

## 6. Payback model and results

**Inputs (defaults).** Average price 44,000 KZT (Case fact). Contribution margin 30% (team assumption). Extra foreign travelers per year at month 24: 1,263 (derived below). Running cost after year 1: 300,000 KZT/month (team assumption).

**Formula.**
- Cash out: 12,000,000 ÷ 3 per month in months 1–3; 8,000,000 ÷ 12 per month in months 1–12; running cost per month from month 13.
- Launch in month 4. Extra travelers in month *m* = (1,263 ÷ 12) × ramp(*m*), with ramp(*m*) = (*m* − 3) ÷ 21 for months 4–24 and 1 from month 24.
- Contribution per traveler = 44,000 × 30% = **13,200 KZT**.
- Monthly net = travelers × 13,200 − costs. Payback = first month with cumulative cash ≥ 0.
- Downside = travelers × 0.7.

**Results (defaults).**

| | Base | Downside (× 0.7) |
|---|---:|---:|
| Lowest cumulative cash (month 12) | −17.0M KZT | −17.9M KZT |
| Cumulative cash at month 24 | −8.3M KZT | −12.9M KZT |
| **Payback month** | **32** | **44** |
| Cumulative cash at month 48 | +17.8M KZT | +3.2M KZT |

Break-even travelers = 20,000,000 ÷ 13,200 = **1,516** extra foreign travelers (cumulative).

**Sensitivity to margin** (other defaults unchanged):

| Margin | 20% | 25% | 30% | 35% | 40% |
|---|---|---|---|---|---|
| Payback base | M46 | M37 | **M32** | M29 | M27 |
| Payback downside | > M48 | > M48 | **M44** | M38 | M34 |

**Derivation of 1,263.** ~4% of 3,400 travelers are foreign today ≈ 136. Keeping ≈ 3,264 domestic travelers, 30% foreign requires 3,264 ÷ 0.7 ≈ 4,663 travelers in total → 30% ≈ 1,399 foreign → ≈ **1,263 more** than today.

**Flagged gap.** 150,000,000 ÷ 3,400 = 44,118 KZT, slightly above the stated 44,000 KZT average price. The model uses 44,000 KZT (conservative).

---

## 7. Risks and mitigations

| # | Risk | Mitigation |
|---|---|---|
| 1 | Payment-provider approval for Alipay / WeChat Pay is slow or refused | Launch with international cards via hosted checkout; apply in week 1; keep manager-assisted payment as fallback |
| 2 | AI concierge gives a wrong answer (price, availability, visa) | Answer only from verified tour data; visible labels; "I won't guess" rule + human hand-off; weekly log review |
| 3 | Low demand from Chinese travelers | 10+ interviews before building; small pilot; test Xiaohongshu content and postcards before paid ads |
| 4 | Cross-border data and privacy | Minimum data (no passport, no card numbers); legal review of Kazakhstan and China rules; family sharing off by default |
| 5 | Guides' Chinese skills are not good enough | Language test; interpreter partners; Chinese-guide availability "Not yet confirmed" until checked; Chinese audio guide as backup |

---

## 8. Evidence checklist — what the team must still verify

- [ ] Open all three source links and confirm the figures and dates (655,000 / +78% / 367,000; 241,700 / +38.9% / Russia 429,800; 15.7 million).
- [ ] Keep the method note: the two China figures use different methods and must not be compared.
- [ ] Find an official source for **112** as Kazakhstan's emergency number (currently "Needs confirmation").
- [ ] Confirm the visa-free rule (30 days per visit, 90 in 180) is still in force on the report date.
- [ ] Payment providers: confirm which accept foreign cards for a Kazakhstan merchant, fees, and Alipay / WeChat Pay onboarding requirements.
- [ ] Confirm park / site entrance fees, Kaindy 4×4 transfer and guesthouse names for each tour (all "Not yet confirmed").
- [ ] Confirm budget line costs with at least 2 quotes (development, localization, video).
- [ ] Justify the 30% contribution margin (or change it — the model is live).
- [ ] Run the 10+ traveler interviews; **do not** report any interview results that were not collected.
- [ ] Check privacy requirements for storing data of Chinese citizens.
- [ ] Make sure every screenshot in the report still shows its labels (Demo data, Proposal, TEST MODE).

---

## 9. AI use (suggested text)

> We used Claude (Anthropic) mainly as a coding assistant: it wrote the code of the clickable prototype (React / TypeScript app, booking flow, scripted concierge, trip builder, payback calculator, SVG illustrations, automated tests). Claude also produced the first draft of the report text from our brief, which the team reviewed and edited. The team chose the idea, the market and the assumptions, and is responsible for checking every fact, source and number.

Keep this accurate. If the team rewrites the report in its own words, the second sentence can be changed to say so. Do not claim "code only" while the report text is still the AI draft.
---

## 10. Best screens to screenshot for the report

1. **Home** — hero, the 6-step closed loop and "Four complaints, four answers" → `screenshots/01-home.png` *(Problem, Originality, Clarity)*
2. **Tour page (Kolsai)** — 4 inclusion groups open, packing "3 of 6", audio guide → `screenshots/02-tour-kolsai.png` *(Problem, Feasibility)*
3. **Booking step 3 + TEST MODE + price summary** → `screenshots/05b-booking-payment.png`, plus confirmation `05d-booking-confirmed.png` *(Feasibility)*
4. **Concierge answering in Chinese / Trust Center** → `screenshots/12-concierge-zh.png`, `09-trust.png` *(Originality, Trust)*
5. **Impact page — payback chart + budget** → `screenshots/08-impact.png` *(Costs, payback & impact)*

Bonus: `07-postcard.png` (viral loop), `04-trip-builder.png`, `13-mobile-home.png` and `16-dark-home.png` (mobile and dark mode).
