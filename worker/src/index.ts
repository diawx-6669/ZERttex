// Saryarqa Go AI proxy (Cloudflare Worker).
// POST /chat · /plan · /caption · /manager  →  Claude (claude-haiku-5-5) or Google Gemini, grounded on grounding.json.
// The API key lives only here (wrangler secret ANTHROPIC_API_KEY or GEMINI_API_KEY); the browser never sees it.
// With GEMINI_API_KEY set, Gemini answers; otherwise Claude.

import Anthropic from '@anthropic-ai/sdk';
import { GeminiError, callGemini } from './gemini';
import { COMMON, ENDPOINTS, isStandalone, type EndpointName } from './prompts';
import { cleanOutput, userInput } from './shared';

export interface Env {
  ANTHROPIC_API_KEY: string;
  /** Optional: answer with Google Gemini instead of Claude. */
  GEMINI_API_KEY?: string;
  /** Optional: point at a mock Gemini API in tests. */
  GEMINI_BASE_URL?: string;
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

async function callModel(env: Env, name: EndpointName, input: Record<string, unknown>) {
  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY, baseURL: env.ANTHROPIC_BASE_URL || undefined, maxRetries: 1, timeout: 7_000 });
  const ep = ENDPOINTS[name];
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: MAX_OUTPUT_TOKENS,
    // Short, grounded answers under a hard 600-token cap: thinking off, low effort.
    thinking: { type: 'disabled' },
    system: isStandalone(name)
      ? [{ type: 'text', text: ep.task }]
      : [
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
    const gemini = !!env.GEMINI_API_KEY;
    if (request.method === 'GET' && url.pathname === '/health') return json({ ok: true, model: gemini ? 'gemini' : MODEL }, 200, cors ?? {});

    const name = url.pathname.replace(/^\/+|\/+$/g, '') as EndpointName;
    if (!(name in ENDPOINTS)) return json({ error: 'not_found' }, 404, cors ?? {});
    if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405, cors ?? {});
    if (!cors) return json({ error: 'origin_not_allowed' }, 403, {});
    if (!env.ANTHROPIC_API_KEY && !gemini) return json({ error: 'not_configured' }, 503, cors);

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
      let raw: unknown;
      let model: string = MODEL;
      if (gemini) {
        const r = await callGemini(env.GEMINI_API_KEY!, name, input, { signal: AbortSignal.timeout(9_000), baseUrl: env.GEMINI_BASE_URL || undefined });
        raw = r.data;
        model = r.model;
      } else raw = await callModel(env, name, input);
      const out = cleanOutput(name, raw);
      if (!out) return json({ error: 'bad_model_output' }, 502, cors);
      return json({ ...out, model, ai: true }, 200, cors);
    } catch (e) {
      if (e instanceof GeminiError) return json({ error: e.status === 429 || e.status === 503 ? 'upstream_rate_limited' : 'upstream_error', status: e.status }, e.status === 429 || e.status === 503 ? 503 : 502, cors);
      if (e instanceof Anthropic.RateLimitError) return json({ error: 'upstream_rate_limited' }, 503, cors);
      if (e instanceof Anthropic.APIError) return json({ error: 'upstream_error', status: e.status }, 502, cors);
      return json({ error: 'model_failed' }, 502, cors);
    }
  },
};
