// Saryarqa Go AI proxy (Cloudflare Worker).
// POST /chat · /plan · /caption · /manager  →  Claude (claude-haiku-5-5), grounded on grounding.json.
// The API key lives only here (wrangler secret ANTHROPIC_API_KEY); the browser never sees it.

import Anthropic from '@anthropic-ai/sdk';
import { BUDGETS, COMMON, ENDPOINTS, INTERESTS, LABELS, ROUTES, TOUR_IDS, type EndpointName } from './prompts';

export interface Env {
  ANTHROPIC_API_KEY: string;
  /** Optional comma-separated override of the CORS allow-list. */
  ALLOWED_ORIGINS?: string;
  /** Optional: point at a mock Messages API in tests. */
  ANTHROPIC_BASE_URL?: string;
  /** Optional KV namespace for a rate limit shared by all Worker instances. */
  RATE_KV?: KVNamespace;
}

const MODEL = 'claude-haiku-5-5';
const MAX_OUTPUT_TOKENS = 600;
const MAX_BODY_BYTES = 8 * 1024;
const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 10 * 60 * 1000;
const DEFAULT_ORIGINS = ['https://diawx-6669.github.io', 'http://localhost:5173'];

// ---------- helpers ----------
const json = (data: unknown, status: number, cors: Record<string, string>) =>
  new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', ...cors } });

const corsFor = (origin: string | null, env: Env): Record<string, string> | null => {
  const allowed = env.ALLOWED_ORIGINS ? env.ALLOWED_ORIGINS.split(',').map((s) => s.trim()) : DEFAULT_ORIGINS;
  if (!origin || !allowed.includes(origin)) return null;
  return {
    'access-control-allow-origin': origin,
    'access-control-allow-methods': 'POST, OPTIONS',
    'access-control-allow-headers': 'content-type',
    'access-control-max-age': '86400',
    vary: 'Origin',
  };
};

// Best-effort limit: per Worker instance in memory, or shared through KV when RATE_KV is bound.
const hits = new Map<string, number[]>();
async function rateLimited(ip: string, env: Env): Promise<boolean> {
  const now = Date.now();
  if (env.RATE_KV) {
    const key = `rl:${ip}:${Math.floor(now / RATE_WINDOW_MS)}`;
    const n = Number((await env.RATE_KV.get(key)) ?? 0) + 1;
    await env.RATE_KV.put(key, String(n), { expirationTtl: Math.ceil(RATE_WINDOW_MS / 1000) + 60 });
    return n > RATE_LIMIT;
  }
  const list = (hits.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  list.push(now);
  hits.set(ip, list);
  if (hits.size > 5000) hits.clear();
  return list.length > RATE_LIMIT;
}

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const lang = (v: unknown): 'en' | 'zh' => (v === 'zh' ? 'zh' : 'en');
const pick = <T extends string>(arr: unknown, allowed: readonly T[], max = 10): T[] =>
  Array.isArray(arr) ? [...new Set(arr.filter((x): x is T => allowed.includes(x as T)))].slice(0, max) : [];
const strings = (arr: unknown, n: number, maxLen: number) =>
  Array.isArray(arr) ? arr.filter((x): x is string => typeof x === 'string' && x.trim().length > 0).map((x) => x.trim().slice(0, maxLen)).slice(0, n) : [];
const CLAIMS = /(\bbest\b|no\.?\s?1|\bofficial\b|guarantee|\bcertified\b|\blicen[cs]ed\b|最好|第一|官方|保证|认证|最便宜)/i;

// ---------- input: what the browser may send ----------
function userInput(name: EndpointName, body: Record<string, unknown>): Record<string, unknown> | null {
  switch (name) {
    case 'chat': {
      const question = str(body.question, 600);
      if (!question) return null;
      const history = Array.isArray(body.history)
        ? body.history.slice(-6).map((h) => ({ from: (h as { from?: string })?.from === 'user' ? 'user' : 'assistant', text: str((h as { text?: unknown })?.text, 400) }))
        : [];
      return { lang: lang(body.lang), question, recentConversation: history, currentTour: pick([body.tourId], TOUR_IDS)[0] ?? null };
    }
    case 'plan': {
      const text = str(body.text, 800);
      return text ? { lang: lang(body.lang), description: text } : null;
    }
    case 'caption': {
      const tourId = pick([body.tourId], TOUR_IDS)[0];
      return tourId ? { tourId, travelerMessage: str(body.message, 140) } : null;
    }
    case 'manager': {
      const question = str(body.question, 800);
      return question ? { travelerLang: lang(body.travelerLang), question, tourId: pick([body.tourId], TOUR_IDS)[0] ?? null } : null;
    }
  }
}

// ---------- output: validate and clean what the model returned ----------
function cleanOutput(name: EndpointName, raw: unknown): Record<string, unknown> | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  switch (name) {
    case 'chat': {
      const answer = str(o.answer, 1200);
      return answer ? { answer, labels: pick(o.labels, LABELS), actions: pick(o.actions, ROUTES, 3) } : null;
    }
    case 'plan': {
      const int = (v: unknown, lo: number, hi: number) => (Number.isInteger(v) && (v as number) >= lo && (v as number) <= hi ? (v as number) : 0);
      return {
        destinations: pick(o.destinations, TOUR_IDS, 4),
        days: int(o.days, 1, 30),
        travelers: int(o.travelers, 1, 12),
        interests: pick(o.interests, INTERESTS, 5),
        budget: pick([o.budget], BUDGETS)[0] ?? 'unknown',
        note: str(o.note, 300),
      };
    }
    case 'caption': {
      const zh = strings(o.zh, 3, 80).filter((c) => !CLAIMS.test(c));
      const en = strings(o.en, 3, 160).filter((c) => !CLAIMS.test(c));
      return zh.length && en.length ? { zh, en } : null;
    }
    case 'manager': {
      const summary = str(o.summary_ru, 600);
      const reply = str(o.reply, 1500);
      return summary && reply ? { summary_ru: summary, reply, check_ru: strings(o.check_ru, 4, 200), labels: pick(o.labels, LABELS) } : null;
    }
  }
}

async function callModel(env: Env, name: EndpointName, input: Record<string, unknown>) {
  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY, baseURL: env.ANTHROPIC_BASE_URL || undefined, maxRetries: 1, timeout: 7_000 });
  const ep = ENDPOINTS[name];
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: MAX_OUTPUT_TOKENS,
    // Short, grounded answers under a hard 600-token cap: thinking off, low effort.
    thinking: { type: 'disabled' },
    system: [
      { type: 'text', text: COMMON, cache_control: { type: 'ephemeral' } },
      { type: 'text', text: ep.task },
    ],
    output_config: { effort: 'low', format: { type: 'json_schema', schema: ep.schema as unknown as Record<string, unknown> } },
    messages: [{ role: 'user', content: JSON.stringify(input) }],
  });
  if (response.stop_reason !== 'end_turn') throw new Error(`stop_reason ${response.stop_reason}`);
  const text = response.content.find((b): b is Anthropic.TextBlock => b.type === 'text')?.text ?? '';
  return JSON.parse(text) as unknown;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const origin = request.headers.get('origin');
    const cors = corsFor(origin, env);

    if (request.method === 'OPTIONS') return cors ? new Response(null, { status: 204, headers: cors }) : new Response(null, { status: 403 });
    if (request.method === 'GET' && url.pathname === '/health') return json({ ok: true, model: MODEL }, 200, cors ?? {});

    const name = url.pathname.replace(/^\/+|\/+$/g, '') as EndpointName;
    if (!(name in ENDPOINTS)) return json({ error: 'not_found' }, 404, cors ?? {});
    if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405, cors ?? {});
    if (!cors) return json({ error: 'origin_not_allowed' }, 403, {});
    if (!env.ANTHROPIC_API_KEY) return json({ error: 'not_configured' }, 503, cors);

    if (Number(request.headers.get('content-length') ?? 0) > MAX_BODY_BYTES) return json({ error: 'body_too_large' }, 413, cors);
    const raw = await request.text();
    if (new TextEncoder().encode(raw).length > MAX_BODY_BYTES) return json({ error: 'body_too_large' }, 413, cors);

    const ip = request.headers.get('cf-connecting-ip') ?? 'unknown';
    if (await rateLimited(ip, env)) return json({ error: 'rate_limited' }, 429, { ...cors, 'retry-after': '600' });

    let body: Record<string, unknown>;
    try {
      body = JSON.parse(raw);
    } catch {
      return json({ error: 'bad_json' }, 400, cors);
    }
    const input = body && typeof body === 'object' ? userInput(name, body) : null;
    if (!input) return json({ error: 'bad_input' }, 400, cors);

    try {
      const out = cleanOutput(name, await callModel(env, name, input));
      if (!out) return json({ error: 'bad_model_output' }, 502, cors);
      return json({ ...out, model: MODEL, ai: true }, 200, cors);
    } catch (e) {
      if (e instanceof Anthropic.RateLimitError) return json({ error: 'upstream_rate_limited' }, 503, cors);
      if (e instanceof Anthropic.APIError) return json({ error: 'upstream_error', status: e.status }, 502, cors);
      return json({ error: 'model_failed' }, 502, cors);
    }
  },
};
