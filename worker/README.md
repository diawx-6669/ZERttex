# Saryarqa Go AI Worker

A small Cloudflare Worker that sits between the website and the Claude API.
The website never sees the API key; the Worker only answers from the verified
data in `src/grounding.json` (generated from `../src/data`).

| Endpoint | Input (JSON) | Output (JSON) |
|---|---|---|
| `POST /chat` | `{ question, lang: "en"\|"zh", tourId?, history? }` | `{ answer, labels[], actions[] }` |
| `POST /plan` | `{ text, lang }` | `{ destinations[], days, travelers, interests[], budget, note }` (preferences only; the app's rules-based trip builder makes the itinerary) |
| `POST /caption` | `{ tourId, message? }` | `{ zh: [3], en: [3] }` |
| `POST /manager` | `{ question, travelerLang, tourId? }` | `{ summary_ru, reply, check_ru[], labels[] }` (a draft; staff must edit and approve) |
| `GET /health` | | `{ ok, model }` |

Model: `claude-haiku-5-5` · max 600 output tokens · thinking off, effort `low` · JSON schema output · the grounding block is prompt-cached.
Guards: CORS allow-list (`https://diawx-6669.github.io`, `http://localhost:5173`), body ≤ 8 KB, 20 requests per IP per 10 minutes (in memory per instance; bind `RATE_KV` for a shared limit), model output re-validated (unknown labels / routes dropped, captions with brand claims dropped). If anything fails the Worker returns an error and the website silently uses its scripted answers.

## Deploy (about 10 minutes)

You need a free Cloudflare account and an Anthropic API key (console.anthropic.com → API keys).

```bash
cd worker
npm install
npx wrangler login                      # opens the browser once
npx wrangler secret put ANTHROPIC_API_KEY   # paste the key when asked; it is stored only in Cloudflare
# or, to answer with Google Gemini instead of Claude (same prompts, cleaning and price guard):
npx wrangler secret put GEMINI_API_KEY      # an AI Studio key; with it set, Gemini answers
npx wrangler deploy                     # prints the URL, e.g. https://saryarqa-ai.<your-subdomain>.workers.dev
curl https://saryarqa-ai.<your-subdomain>.workers.dev/health   # → {"ok":true,"model":"claude-haiku-5-5"}
```

(Starting from scratch instead? `npm create cloudflare@latest` creates an empty Worker; copy `src/`, `wrangler.toml` and `package.json` from this folder into it.)

After you change tours, facts or policies in `../src/data`, regenerate the grounding and redeploy:

```bash
cd .. && npm run grounding && cd worker && npx wrangler deploy
```

## Connect the website

The website reads the Worker URL at **build time** from `VITE_AI_ENDPOINT`. Without it, the site runs fully in scripted mode.

**Local build:**

```bash
# in the repo root
echo "VITE_AI_ENDPOINT=https://saryarqa-ai.<your-subdomain>.workers.dev" > .env.local   # .env* is git-ignored
npm run build      # docs/index.html now calls the Worker
```

**GitHub Actions build** (if you build Pages in CI): add a repository variable `VITE_AI_ENDPOINT` (Settings → Secrets and variables → Actions → Variables) and pass it to the build step:

```yaml
- run: npm ci && npm run build
  env:
    VITE_AI_ENDPOINT: ${{ vars.VITE_AI_ENDPOINT }}
```

The URL is not a secret (it is visible in the built page); the API key is, and it never leaves Cloudflare.

On stage: the footer has a **"Scripted demo only"** switch that forces scripted answers, and the app falls back automatically when the Worker fails or takes more than 8 seconds.

## Test locally (no key, no network to Anthropic)

```bash
npm test     # starts `wrangler dev` against a mock Messages API: CORS, limits, schema cleaning, 413/429 paths (21 checks)
npm run typecheck
```

`npm run dev` runs the Worker on http://localhost:8787 with your real key from `.dev.vars` (git-ignored):

```
ANTHROPIC_API_KEY=sk-ant-...
```

## Cost estimate per 1,000 chats — Needs confirmation

Prices used: Claude Haiku 5.5, **$0.10 per million input tokens and $0.50 per million output tokens** (prompts up to 100K tokens); prompt-cache reads cost 0.1× the input price and 5-minute cache writes 1.25×. Source: Anthropic's model/pricing table as shipped in the Claude API reference used to build this (cached 6 Oct 2026). Check the live page before quoting: https://platform.claude.com/docs/en/about-claude/pricing

Assumptions (ours, not measured): each request sends ≈ 8,000 input tokens (rules + the 19 KB grounding JSON + the question) and gets ≈ 250 output tokens back. Run a few real requests and read `usage` to replace these with measured numbers.

| Case | Input | Output | Total per 1,000 chats |
|---|---:|---:|---:|
| No cache hits (every request writes the cache, 1.25×) | 8 million tok × $0.125 = $1.00 | 0.25 million tok × $0.50 = $0.125 | **≈ $1.13** |
| Mostly cache hits (busy hours) | 8 million tok × $0.01 = $0.08 | $0.125 | **≈ $0.21** |

So roughly **$0.2–$1.1 per 1,000 chats**. Even at 10,000 chats a month this fits easily inside the existing "Hosting, AI usage, maintenance" line (1,500,000 KZT for year 1) in `src/data/budget.ts`; no new budget line is needed. Cloudflare Workers' free plan allows 100,000 requests per day (check Cloudflare's current limits).
