# Saryarqa Go · Live demo script (2:30)

Language: English (same as the slides). One presenter clicks, one speaks.
Live site: https://diawx-6669.github.io/ZERttex/ · Offline copy: `docs/index.html` (single file, opens by double-click).

## 30 minutes before

1. Open the live site in a **fresh browser window** (no old chat history or bookings; if needed, clear site data).
2. Test the venue Wi-Fi: open a tour page. Do the photos load? Does the chat answer?
3. Decide the AI mode **before** going on stage:
   - Live AI works and answers in < 3 s → leave it on (footer shows "Live AI · beta").
   - Any doubt → footer → tick **"Scripted demo only"**. The demo is identical, the answers come from the scripted concierge.
4. Open a second tab with the offline copy `docs/index.html` (from the laptop, not the network).
5. Set zoom to 110–125% so the back row can read it. EN selected.
6. Have one phone ready with mobile data to show the QR scan if no judge scans it.

## Click path (timed)

| Time | Click | Say |
|---|---|---|
| 0:00 | Home → **Explore tours** → **Kolsai Lakes & Kaindy** | "A traveler from Shanghai lands on a tour page." |
| 0:10 | **Open all** (What's included) | "Four lists. Note 'Not yet confirmed': the Kaindy 4x4 transfer and park fees. We say it before the traveler pays." |
| 0:25 | **Ask a question** (opens the chat with the inclusion question) | "The concierge answers from the same verified data." |
| 0:35 | Type `外国银行卡能用吗？` → Enter | "In Chinese, it answers in Chinese." |
| 0:50 | Type `Is Kolsai available on 3 May?` → Enter | "It cannot see live seats, so it does not guess. It hands the question to a person." |
| 1:00 | Enter any email (e.g. `li.wei@example.com`) → **Send to manager** → Esc | |
| 1:05 | Footer → **Manager inbox (staff demo)** → click the new question → **Summarize + draft a reply** | "Staff in Astana get a Russian summary and a draft in the traveler's language. The Send button stays locked until a manager fills the [placeholders] and confirms the checks. Nothing is sent automatically." |
| 1:30 | Header **Book** → step 1: Kolsai, keep the date → **Continue** | "Booking in three steps." |
| 1:40 | Name `Li Wei`, email, country **China**, guide language **中文** → **Continue** | |
| 1:50 | **International card** → tick the inclusions/refund box → **Pay (test mode)** | "TEST MODE: no money moves, no card numbers are collected." |
| 2:00 | Booking code appears (SG-XXXX) → Footer **Postcard** | |
| 2:05 | Point at the QR → ask a judge to scan it (or scan with our phone) | "A real QR code: it opens this tour with the friend's referral code. That is how the loop starts again." |
| 2:15 | Header **Impact** → scroll to Payback | "Month 32 in the base case, month 44 if results are 30% lower. The sliders are live." |
| 2:30 | Back to slides | |

Tip: if a judge's phone cannot scan the small QR on screen, open `#/print/postcards` (large QR on the A6 postcard) or hand over the printed postcard.

## Fallback plan

| Problem | What we do (no apology longer than one sentence) |
|---|---|
| Live AI is slow or wrong | Nothing to do: after 8 seconds the app answers with the scripted concierge. If it looks odd, footer → tick **Scripted demo only** and continue. |
| Wi-Fi is down | Switch to the tab with **`docs/index.html`** (offline single file). Everything works except: Google Fonts (system font is used), live AI (scripted mode is automatic), and photos unless they were bundled with `npm run photos:offline` (otherwise the illustrated scenes show). |
| QR scan fails | Show our own phone already scanned to the tour page with the referral banner, or show the printed A6 postcard. |
| Projector or laptop fails | Use the 60-second backup video (record it the evening before from this script), then continue with slides 6–8. |
| A step breaks mid-demo | Skip to **Impact**. Say: "The full flow is on the live site; you can try it yourselves." |

## Reset between rehearsals

Open the site in a private window, or clear site data (it stores language, chat inbox and the stage switch in `localStorage`).
