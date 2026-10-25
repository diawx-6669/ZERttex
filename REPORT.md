# Saryarqa Go
### Discover Kazakhstan. Book with confidence.

**ZERTTEX Hackathon 2026 · Stage 1 · Case 1 "Technology Product"**
Team report — full draft (English)

> **How to read this report.** Every number and claim carries one of five labels:
> **[Case fact]** given in the official case · **[Verified source]** published figure with a link ·
> **[Proposal]** our team's idea or assumption · **[Demo data]** invented for the prototype only ·
> **[Needs confirmation]** must be proven before launch.
> The same five labels appear inside the clickable prototype.

---

## Contents

0. Executive summary
1. Problem and relevance *(criterion: 25 pts)*
2. The product and its originality *(25 pts)*
3. Feasibility and the 12-week MVP *(20 pts)*
4. Costs, payback and impact *(20 pts)*
5. Risks and how we reduce them
6. Honesty by design
7. Prototype walkthrough for judges (3 minutes)
8. What we still have to verify
9. AI declaration
Appendix A — Sources · Appendix B — Prototype screens · Appendix C — Technical notes

---

## 0. Executive summary

**The company.** Saryarqa Routes was founded in 2020 in Astana, has 9 full-time staff and about 25 freelance guides, and sells 2–7-day guided trips to Charyn Canyon, Kolsai Lakes, Turkestan and Burabay. In 2025 it served 3,400 travelers and earned 150,000,000 KZT at an average price of 44,000 KZT per traveler. About 96% of travelers were from Kazakhstan. **[Case fact]**

**The goal.** Within 24 months, 30% of travelers from abroad, with up to 20,000,000 KZT for development and launch in year 1. **[Case fact]**

**The problem.** The company sells through Instagram messages, WhatsApp and phone, takes Kaspi transfers or cash, and has a one-page, Russian-only website. Foreign guests said: *"It is unclear how to book." "I am not sure the company is trustworthy." "My foreign card does not work." "I do not know what is included."* **[Case fact]** Every one of these complaints breaks the sale before payment.

**The market we start with.** Chinese-speaking independent travelers (mainland China first) interested in nature, photography and Silk Road culture. China sent 655,000 visitors to Kazakhstan in 2024, +78% on 2023, and the two countries have had a mutual visa-free regime since November 2023 (up to 30 days per visit). **[Verified source]**

**Our answer.** *Saryarqa Go*, an English/Chinese booking app built as **one closed loop**:

```
DISCOVER → PLAN → VERIFY → BOOK → TRAVEL → SHARE ─┐
   ▲                                               │
   └──── the traveler's postcard brings a friend ──┘
```

Each step removes one doubt, and the last step (a shareable postcard sized for Xiaohongshu and WeChat Moments) feeds new travelers back into the first.

**The numbers.** The 12-week MVP and first-year launch fit exactly inside 20,000,000 KZT. Reaching the goal needs about **1,263 extra foreign travelers per year**. With a 30% contribution margin (our assumption), cumulative cash turns positive in **month 32** in the base case and **month 44** if demand is 30% lower. **[Proposal — model]**

**Proof that it works.** A clickable prototype covers the whole loop: tour pages, booking with validation and a simulated declined payment, a bilingual concierge, a trip builder, a trust center, an in-trip screen, a postcard generator and a live payback calculator. An automated test walked through **66 acceptance checks — all passed**, including the 375 px phone width and dark mode.

---

## 1. Problem and relevance

### 1.1 Four complaints, four lost sales

The case gives us four quotes from foreign guests **[Case fact]**. We read each one as a broken step in the buying journey:

| Guest said | Where the sale breaks | Root cause today **[Case fact]** |
|---|---|---|
| "It is unclear how to book." | Before the first contact | Sales only through Instagram DMs, WhatsApp and phone; one-page Russian-only website |
| "I am not sure the company is trustworthy." | Before paying a stranger abroad | No visible proof, no way to meet the people behind the tour |
| "My foreign card does not work." | At payment | Kaspi transfer or cash only |
| "I do not know what is included." | Before committing | No structured description of what the price covers |

None of these is a "nice to have". A traveler who does not understand the process, the company, the payment or the price simply does not book. The company's 96% domestic share **[Case fact]** is what you would expect from a sales process designed for people who already speak Russian and already have Kaspi.

### 1.2 Why Chinese-speaking travelers first

| Fact | Source |
|---|---|
| **655,000** visitors from China in 2024, **+78%** vs 367,000 in 2023 | The Times of Central Asia, 19 June 2025, citing the Ministry of Tourism and Sports **[Verified source]** |
| Mutual **visa-free regime since November 2023**: up to 30 days per visit, max 90 days in 180 days | Same source **[Verified source]** |
| **241,700** Chinese citizens visited in 2025, **+38.9%**; China is the **#2 source market** after Russia (429,800) | Orda.kz, citing Energyprom.kz **[Verified source]** |
| **15.7 million** foreign visitors for tourism purposes in 2025 | The Astana Times, February 2026 **[Verified source]** |

> **Method note.** The 655,000 and 241,700 figures are measured differently (border crossings vs analyst data). We do **not** compare them with each other or compute a trend between them.

Why this segment fits Saryarqa Routes specifically:

- **No visa barrier** for mainland Chinese travelers, so the decision is about trust, clarity and payment — exactly the four complaints. **[Verified source]** + our reasoning
- The product line already matches common interests of independent travelers: **nature and photography** (Charyn, Kolsai, Burabay) and **Silk Road culture** (Turkestan). **[Case fact]** products, **[Proposal]** fit
- Chinese travelers rely on their own payment and social apps (Alipay, WeChat Pay, Xiaohongshu, WeChat Moments). A product built for them needs those rails — which is also why we treat Alipay/WeChat Pay honestly as "planned, needs provider approval". **[Proposal]**
- Starting with **one** foreign segment keeps the MVP small: two languages (English as the bridge, Chinese for the target), one main payment rail (international cards) at launch.

### 1.3 The size of the job

To hit 30% foreign travelers within 24 months, the company needs about **1,263 additional foreign travelers per year** (derivation in §4.3). That is ~105 extra travelers per month at full run rate — roughly 3–4 per day. This is ambitious for a company where ~136 travelers a year are foreign today, which is why the product must remove every barrier at once rather than fix one complaint.

---

## 2. The product and its originality

### 2.1 One closed loop, not a pile of features

Most booking sites stop at payment. Saryarqa Go covers the whole trip and closes the circle:

| Step | What the traveler does | Feature | Doubt removed |
|---|---|---|---|
| **1 · Discover** | Browses 4 tours in English or Chinese | Tour pages with "What's included" in 4 groups, day-by-day plan, packing list | "I don't know what is included" |
| **2 · Plan** | Says where, how long, what they like | Rules-based trip builder (arrival, tour days, transfers between Almaty, Turkestan and Astana, city days) | "Can I fit this into my trip?" |
| **3 · Verify** | Checks who they will travel with | Trust Center: guide intro video, 5-minute video call before paying, honest checklist, refund guarantee | "Is this company real?" |
| **4 · Book** | Pays in 3 steps with a foreign card | Booking: trip → lead traveler → payment; KZT + indicative USD/CNY; hosted checkout | "How do I book? Will my card work?" |
| **5 · Travel** | Gets help during the trip | My trip: timeline, daily check-ins, family updates, weather and road rescheduling, Chinese audio guide | "What if something goes wrong?" |
| **6 · Share** | Posts a postcard of the trip | 4:5 postcard for Xiaohongshu / WeChat Moments / Instagram with referral link | → brings the next traveler to step 1 |

### 2.2 Four complaints, four answers

| Complaint **[Case fact]** | Answer in the product |
|---|---|
| "It is unclear how to book." | **Three visible steps** with inline errors in plain language; the trip builder fills the booking for you; the concierge explains the process in English or Chinese. |
| "I am not sure the company is trustworthy." | **Meet your guide first:** 60-second intro video and a 5-minute video call before paying. **Honest checklist:** company facts shown as facts; licence, registration and insurance shown as "document to be provided" until they are. **Money held until the tour starts** with written refund rules. **[Proposal]** |
| "My foreign card does not work." | **International card through the payment provider's hosted page** (we never handle card numbers). Alipay and WeChat Pay labelled "Planned · requires provider approval". Price in KZT with USD/CNY next to it. |
| "I do not know what is included." | Every tour lists **Included / Optional extra / Not included / Not yet confirmed**. The booking summary repeats "Included" and "Not yet confirmed" **right before payment**, so nothing is hidden. |

### 2.3 What makes it original

1. **"Not yet confirmed" as a feature.** Travel sites usually hide uncertainty. We show it: park fees, guesthouse names, the Kaindy 4×4 transfer and Chinese-guide availability are listed in their own orange group and promised in writing before the trip. Honesty about the unknown is our trust signal.
2. **Meet the guide before you pay.** For a traveler abroad, the guide *is* the company. A short video and an optional 5-minute call turn an unknown Kazakh company into a person.
3. **A concierge that refuses to guess.** It answers in the traveler's language, but only from verified tour data. Asked about live availability or discounts, it says *"I won't guess"* and passes the question to a human manager.
4. **Safety for the family at home.** Family sharing is **off by default**, limited to one trip, ends automatically and shares check-in status — not live GPS. It addresses a real worry of travelers' families without collecting more data than needed. **[Proposal]**
5. **Rescheduling for mountain weather.** Road closures and early snow are real risks on mountain routes; the product turns them into a simple "pick another date" request instead of a lost trip. **[Proposal]**
6. **The postcard closes the loop.** The trip ends with content the traveler wants to post anyway, sized for Chinese social apps, carrying a referral link. Word of mouth becomes the cheapest acquisition channel. **[Proposal]**

### 2.4 Who it is for (target persona) **[Proposal]**

> *Illustrative persona, not an interview result.*
>
> **Li, 29, Shanghai.** Works in design, travels independently twice a year, plans on Xiaohongshu, pays with Alipay and a Visa card. Wants dramatic landscapes for photos and a bit of Silk Road history. Speaks some English, prefers Chinese for anything about money. Main fears: hidden costs, a company that disappears after payment, getting stuck if the mountain road closes.

Every feature in the loop maps to one of Li's fears.

---

## 3. Feasibility and the 12-week MVP

### 3.1 What is already built (prototype)

The prototype is not a mock-up: every button works in the browser.

| Area | Status in prototype |
|---|---|
| 4 tour pages in EN/中文 with 4 inclusion groups, itinerary, packing list, audio guide | Working |
| 3-step booking with validation, multi-tour cart, declined-payment simulation, confirmation code | Working (payment simulated, TEST MODE) |
| Bilingual concierge with auto language detection, ~16 topics, action buttons, human hand-off | Working (scripted, not live AI) |
| Trip builder with transfers, city days, cost estimate, prefilled booking | Working (rules-based) |
| Trust Center: guide intro slideshow, 3 sample guides, video-call request, checklist, refund rules | Working (sample guides) |
| My trip: timeline, family sharing switch, weather/road simulation, reschedule request | Working (demo data) |
| Postcard with own photos (stay in browser), decorative QR, referral link | Working |
| Impact page: Gantt, budget, live payback model with 3 sliders | Working |
| Mobile (375 px), dark mode, larger text, keyboard access | Working |

Automated acceptance run: **66 / 66 checks passed** (see Appendix C).

### 3.2 12-week MVP plan

| Weeks | Work | Deliverable | Done when |
|---|---|---|---|
| **W1–2** | Research & validation | 10+ interviews with Chinese-speaking travelers; apply to payment providers; collect company documents | Interview notes; provider applications sent |
| **W3–4** | UX + tour pages | Wireframes, EN/中文 tour pages, design system | 4 tour pages reviewed by 3+ target users |
| **W5–7** | Booking + inclusions + concierge + trust | Booking backend, hosted-checkout sandbox, scripted concierge, Trust Center with real guide videos | Test booking end-to-end in sandbox |
| **W8–9** | Trip builder + checkout + weather/reschedule | Trip builder, live checkout, operator reschedule workflow | First real payment in test mode by staff |
| **W10–11** | Usability tests + payment-provider checks | 5–8 test sessions; fixes; provider due diligence | No blocking issue left in tests |
| **W12** | Pilot with real users | Limited launch with real travelers | Pilot metrics collected (§4.6) |

**[Proposal]**

### 3.3 In the MVP vs later

| In MVP (12 weeks) | Later phases |
|---|---|
| EN/中文 tour pages with "What's included" | Live LLM concierge with retrieval over verified tour data |
| 3-step booking, international card via hosted checkout | Live Alipay / WeChat Pay after provider approval |
| Scripted bilingual concierge + human hand-off | Live weather and road feeds |
| Trust Center: guide videos, checklist, refund policy | GPS-based family sharing (opt-in) |
| Rules-based trip builder | Offline audio downloads |
| My trip: timeline, check-ins, reschedule requests | Listing on Trip.com / Klook |
| Postcard + referral link | |

The rule: **anything that needs a third party's approval or live data goes to "later"**, so the MVP can ship in 12 weeks regardless.

### 3.4 Tools and team **[Proposal]**

| Layer | Tool choice | Why |
|---|---|---|
| Front end | React + TypeScript + Tailwind (as in the prototype) | Reuses the prototype code; mobile-first |
| Back end & database | Managed backend (e.g. PostgreSQL with an admin panel) | Bookings, tours, availability, guides |
| Payments | Payment provider's **hosted checkout + webhooks** | No card data on our servers; foreign cards from day one |
| Concierge | Scripted FAQ first; LLM with retrieval over verified data later | Accuracy before cleverness |
| Content | Guide videos (phone + gimbal), EN/中文 copy by a native speaker | Trust content is cheap and high-impact |
| Analytics | Funnel tracking (start → paid), concierge hand-off rate | Measures the pilot |

**People.** A small contracted team (product designer, 2 developers, Chinese localizer) managed by one Saryarqa Routes staff member as product owner; guides record their own intro videos. The company's 9 staff handle hand-off questions and confirmations.

---

## 4. Costs, payback and impact

### 4.1 Year-1 budget — exactly 20,000,000 KZT **[Proposal — planning assumptions]**

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

One-time build: **12,000,000 KZT**. Recurring year-1 spend + contingency: **8,000,000 KZT**. After year 1, running cost is assumed at **300,000 KZT/month**.

### 4.2 Payback model

**Assumptions**

| Input | Value | Label |
|---|---|---|
| Average price per traveler | 44,000 KZT | Case fact |
| Contribution margin | 30% | Proposal (team assumption) |
| Contribution per traveler | 44,000 × 30% = **13,200 KZT** | Calculated |
| Extra foreign travelers per year at month 24 | 1,263 | Derived from the case goal (§4.3) |
| Running cost after year 1 | 300,000 KZT / month | Proposal |
| Launch | Month 4 | Proposal |

**Formula**

- **Costs:** 12,000,000 ÷ 3 per month in months 1–3; 8,000,000 ÷ 12 per month in months 1–12; 300,000 per month from month 13.
- **Travelers in month *m*:** (1,263 ÷ 12) × ramp(*m*), with ramp = (*m* − 3) ÷ 21 for months 4–24, then 1 (flat).
- **Net in month *m*:** travelers × 13,200 − costs.
- **Payback:** first month where cumulative net ≥ 0.
- **Downside:** same, with travelers × 0.7.

**Results with the default inputs** (defaults were **not** tuned to look good)

| | Base | Downside (× 0.7) |
|---|---:|---:|
| Lowest cumulative cash (month 12) | −17.0M KZT | −17.9M KZT |
| Cumulative cash at month 24 | −8.3M KZT | −12.9M KZT |
| **Payback month** | **Month 32** | **Month 44** |
| Cumulative cash at month 48 | +17.8M KZT | +3.2M KZT |
| Break-even travelers (20M ÷ 13,200) | 1,516 | 1,516 |

**Sensitivity: what if our margin assumption is wrong?**

| Contribution margin | 20% | 25% | **30%** | 35% | 40% |
|---|---|---|---|---|---|
| Payback · base | M46 | M37 | **M32** | M29 | M27 |
| Payback · downside | > M48 | > M48 | **M44** | M38 | M34 |

**Reading the model honestly.** The investment pays back within the 48-month horizon in the base case for any margin from 20% upwards. In the downside case it needs a margin of about 30% or more. The margin is therefore the number the team must check first with real cost data from the company (see §8). Judges can move all three sliders on the prototype's Impact page and watch the chart update.

### 4.3 Where 1,263 comes from

1. About 4% of 3,400 travelers are foreign today (~96% domestic **[Case fact]**) → **≈ 136** foreign travelers.
2. Keep ≈ **3,264** domestic travelers. For foreigners to be 30% of the total: 3,264 ÷ 0.7 ≈ **4,663** travelers in total.
3. 30% of 4,663 ≈ **1,399** foreign travelers → **≈ 1,263 more** than today.

**Flagged gap.** 150,000,000 ÷ 3,400 = **44,118 KZT**, slightly above the stated average price of 44,000 KZT **[Case fact]**. The model uses 44,000 KZT, which is the more conservative choice.

### 4.4 Impact on the company **[Proposal]**

- A **second revenue stream** next to an almost fully domestic base, which also spreads seasonality and currency risk.
- **Direct online bookings** instead of chat-only sales; fewer repetitive questions for 9 staff thanks to the concierge and clear inclusions.
- **Reusable assets:** bilingual tour data, guide videos and trust content that also work for domestic and other foreign markets later.

### 4.5 Impact on travelers and on Kazakhstan **[Proposal]**

- **Travelers:** clear prices and inclusions before paying; pay with their own card; content in their language; meet the guide first; written refund rules; family can see they are safe.
- **Kazakhstan's image abroad:** a trusted, easy-to-book experience is the best advertisement for Kazakhstan as a destination for Chinese travelers; postcards on Xiaohongshu and WeChat carry that image further; demand spreads beyond the big cities to regions such as Charyn, Kolsai, Turkestan and Burabay.

### 4.6 Pilot success metrics

| Metric | How we measure | Target |
|---|---|---|
| Booking completion (start → paid) | Funnel analytics | Set after the pilot baseline |
| Concierge questions answered without hand-off | Concierge logs; every wrong answer reviewed | Track |
| Pre-trip video calls requested | Share of bookings | Track |
| Foreign travelers per month | Bookings by country | Ramp toward ≈ 105 / month by month 24 |
| Postcards shared → referral bookings | Referral link clicks and bookings | Track |
| Post-trip satisfaction | Survey after every pilot trip | Collect |

We deliberately do **not** invent conversion targets before we have a baseline.

---

## 5. Risks and how we reduce them

| # | Risk | Likelihood / impact **[Proposal]** | Mitigation |
|---|---|---|---|
| 1 | **Payment-provider approval** for Alipay / WeChat Pay is slow or refused | Medium / High | Launch with international cards via hosted checkout; apply in week 1; manager-assisted payment as fallback |
| 2 | **Wrong AI answers** (price, availability, visa) | Medium / High | Answer only from verified data; visible labels; "I won't guess" + human hand-off; weekly log review |
| 3 | **Low demand** from Chinese travelers | Medium / High | 10+ interviews before building; small pilot; test Xiaohongshu content and postcards before paid ads |
| 4 | **Cross-border data and privacy** | Medium / Medium | Collect the minimum (no passport, no card numbers); legal review of Kazakhstan and China rules; family sharing off by default |
| 5 | **Guides' Chinese skills** not good enough | High / Medium | Language test; interpreter partners; Chinese-guide availability marked "Not yet confirmed" until checked; Chinese audio guide as a backup |

---

## 6. Honesty by design

Our product promise is trust, so the prototype itself follows strict rules:

- **No invented statistics, reviews, licences, insurance, partnerships, awards, interview results or conversion rates.**
- **Payments are a simulation** with a striped **TEST MODE** banner. The app **never** shows card-number fields and **never** asks for passport data.
- **AI features are labelled "Demo · scripted, not live AI".** The concierge never claims availability, prices or credentials it does not have.
- **Weather and road data are demo data. Guide profiles are sample profiles, not real people.**
- **Licence, registration and insurance** are shown as "Needs confirmation · document to be provided by company" until the company provides them.
- A **legend of the five labels** appears in the footer of every screen.

---

## 7. Prototype walkthrough for judges (3 minutes)

1. **Home** — see the 6-step loop and "Four complaints, four answers". Tap **Explore tours**.
2. **Kolsai Lakes & Kaindy** — tap **Open all**: four colored groups, including *Not yet confirmed*. Tick 3 items in the packing list ("3 of 6 packed"). Press ▶ on an audio stop, switch to 中文.
3. **Ask a question** — the concierge asks about Kolsai automatically. Type `外国银行卡能用吗？` → the answer comes back in Chinese. Ask `Is Kolsai available on 3 May?` → "I won't guess" + manager form.
4. **Plan a trip** — select Kolsai + Burabay, slide to 8 days, **Build my itinerary** → a transfer Almaty → Astana appears. Tap **Book these tours**.
5. **Booking** — press **Continue** with empty fields to see errors; fill them; on step 3 tick **Demo: simulate a declined payment** → retry → confirmation code `SG-XXXX`.
6. **My trip** — **Advance demo time**, turn on family sharing, choose **Road closure** → pick a date → **Request reschedule**. Advance to the end → **Make your postcard**.
7. **Postcard** — add your own photo, **Copy link**, then **See what your friend sees** → back to step 1 with a referral banner.
8. **Impact** — move the margin slider and watch the payback months and chart change.

Switch **EN / 中文** in the header at any point; try it on a phone.

---

## 8. What we still have to verify

- [ ] Re-open the three source links and confirm all figures and dates.
- [ ] Find an official source for **112** as Kazakhstan's emergency number.
- [ ] Confirm the visa-free rule is still in force on the submission date.
- [ ] Confirm which payment providers accept foreign cards for a Kazakhstan merchant, their fees and the Alipay / WeChat Pay onboarding requirements.
- [ ] Confirm park/site fees, the Kaindy 4×4 transfer and guesthouse names for each tour.
- [ ] Get at least two quotes for development, localization and video.
- [ ] Check the 30% contribution margin against the company's real costs.
- [ ] Run the 10+ traveler interviews (and report only what was actually collected).
- [ ] Check privacy rules for storing data of Chinese citizens.

---

## 9. AI declaration

> We used Claude (Anthropic) as an AI coding assistant to build the clickable prototype (React / TypeScript code, SVG illustrations, scripted concierge logic and the payback calculator) and to draft parts of this report. All case facts, market sources, assumptions and final decisions were checked and are owned by the team.

---

## Appendix A — Sources

1. The Times of Central Asia, 19 June 2025, citing the Ministry of Tourism and Sports. https://timesca.com/kazakhstan-launches-2025-year-of-china-tourism/
2. Orda.kz, citing Energyprom.kz. https://en.orda.kz/chinese-tourist-arrivals-in-kazakhstan-rose-sharply-in-2025-analysts-say-10111/
3. The Astana Times, February 2026. https://astanatimes.com/2026/02/kazakhstan-reports-tourism-growth-surge-as-visitor-numbers-and-revenues-climb-in-2025/
4. ZERTTEX Hackathon 2026, Stage 1, Case 1 brief (company facts).

## Appendix B — Prototype screens

| Screen | File | Shows |
|---|---|---|
| Home: loop + complaints | `screenshots/01-home.png` | Problem, originality |
| Tour page (Kolsai) | `screenshots/02-tour-kolsai.png` | Inclusions, packing, audio guide |
| Concierge | `screenshots/03-concierge.png`, `12-concierge-zh.png` | EN + 中文 answers, hand-off |
| Trip builder | `screenshots/04-trip-builder.png` | 8-day plan with transfer |
| Booking | `screenshots/05a…05d-*.png` | Errors, payment, decline, confirmation |
| My trip | `screenshots/06-my-trip.png` | Timeline, family sharing, rescheduling |
| Postcard | `screenshots/07-postcard.png` | Viral loop |
| Impact | `screenshots/08-impact.png` | Gantt, budget, payback |
| Trust Center | `screenshots/09-trust.png` | Guide video, checklist, refund |
| Chinese UI | `screenshots/10-home-zh.png`, `11-tour-turkestan-zh.png` | Full localization |
| Mobile | `screenshots/13…15-mobile-*.png` | 375 px layout, menu drawer |
| Dark mode | `screenshots/16…18-dark-*.png` | Theme support |

## Appendix C — Technical notes

- **Stack:** React 18, TypeScript (strict), Vite, Tailwind CSS; single-file build (`dist/index.html`, ~383 kB, ~120 kB gzipped) that opens by double-click.
- **No backend, no API keys, no runtime network calls** except Google Fonts. Illustrations are inline SVG, so the demo works offline.
- **Accessibility:** labels on every input, visible focus, keyboard-operable controls, `aria-live` chat, larger-text mode, `prefers-reduced-motion` respected.
- **Automated acceptance test (Playwright): 66 / 66 checks passed** — every loop step, booking validation, decline and success, Chinese answers, the Kolsai + Burabay 8-day plan with the Astana transfer, a budget total of exactly 20,000,000 KZT, payback at months 32 / 44, no horizontal scroll at 375 px on all 12 routes, dark mode, and zero JavaScript errors.
