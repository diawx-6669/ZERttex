// Browser side of the optional live AI. Two ways to reach a model:
//  1. Server (production): the Worker in worker/, URL set at build time in VITE_AI_ENDPOINT.
//     The API key lives only on the server.
//  2. Demo key (pitch laptop): a Google Gemini key saved in THIS browser only, from the
//     footer "AI key" field or a one-time link #/?aikey=… (removed from the address bar at once).
//     It is never in the repository or the published files.
// Both use the same grounding, prompts, output cleaning and price guard (worker/src/shared.ts).
// Every call returns null on any problem (no AI, forced scripted mode, network error,
// timeout, non-200, invalid JSON, wrong shape) and the caller then uses its scripted logic.
import { useSyncExternalStore } from 'react';
import type { Interest, TagKind, TourId } from '../data/types';
import { callGemini } from '../../worker/src/gemini';
import { cleanOutput, userInput } from '../../worker/src/shared';

const ENDPOINT = String(import.meta.env.VITE_AI_ENDPOINT ?? '').trim().replace(/\/+$/, '');
const serverConfigured = /^https?:\/\/\S+$/.test(ENDPOINT);
/** Server: 8 s. Demo key goes straight to Google and may fall through to a second model: 12 s. */
export const AI_TIMEOUT_MS = 8000;
const DIRECT_TIMEOUT_MS = 12000;

// ---------- demo key, kept in this browser only ----------
const KEY_STORE = 'sg.geminiKey';
let demoKey = (() => {
  try {
    return window.localStorage.getItem(KEY_STORE) ?? '';
  } catch {
    return '';
  }
})();
export const setDemoKey = (k: string) => {
  demoKey = k.trim();
  try {
    if (demoKey) window.localStorage.setItem(KEY_STORE, demoKey);
    else window.localStorage.removeItem(KEY_STORE);
  } catch {
    /* ignore */
  }
  subs.forEach((f) => f());
};
/** One-time link #/?aikey=…: save the key, then strip it from the address bar and history. */
export function takeKeyFromUrl() {
  const h = window.location.hash;
  const m = h.match(/[?&]aikey=([^&]+)/);
  if (!m) return;
  setDemoKey(decodeURIComponent(m[1]));
  const clean = h.replace(/([?&])aikey=[^&]+&?/, '$1').replace(/[?&]$/, '');
  window.history.replaceState(null, '', window.location.pathname + window.location.search + clean);
}
export const aiConfigured = () => serverConfigured || !!demoKey;
export const aiSource = (): 'server' | 'demo-key' | 'none' => (serverConfigured ? 'server' : demoKey ? 'demo-key' : 'none');

// ---------- "Scripted demo only" switch (footer), remembered on this device ----------
const KEY = 'sg.scripted';
let forced = (() => {
  try {
    return window.localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
})();
const subs = new Set<() => void>();
export const setForceScripted = (v: boolean) => {
  forced = v;
  try {
    window.localStorage.setItem(KEY, v ? '1' : '0');
  } catch {
    /* ignore */
  }
  subs.forEach((f) => f());
};
const subscribe = (f: () => void) => (subs.add(f), () => subs.delete(f));
export const aiLive = () => aiConfigured() && !forced;
export type AiMode = 'live' | 'scripted';
export const useAiMode = (): AiMode => useSyncExternalStore(subscribe, () => (aiLive() ? 'live' : 'scripted'));
export const useForceScripted = () => useSyncExternalStore(subscribe, () => forced);
export const useAiSource = () => useSyncExternalStore(subscribe, aiSource);

// ---------- transport ----------
export async function callAi<T>(path: 'chat' | 'plan' | 'caption' | 'manager' | 'translate', body: object, validate: (x: unknown) => T | null): Promise<T | null> {
  if (!aiLive()) return null;
  const ctrl = new AbortController();
  const timer = window.setTimeout(() => ctrl.abort(), serverConfigured ? AI_TIMEOUT_MS : DIRECT_TIMEOUT_MS);
  try {
    if (!serverConfigured) {
      // Demo key: same input shaping, prompts, cleaning and price guard as the Worker.
      const input = userInput(path, body as Record<string, unknown>);
      if (!input) return null;
      const r = await callGemini(demoKey, path, input, { signal: ctrl.signal });
      const out = cleanOutput(path, r.data);
      return out ? validate({ ...out, model: r.model, ai: true }) : null;
    }
    const res = await fetch(`${ENDPOINT}/${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    if (!res.ok) return null;
    const text = await res.text();
    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      return null;
    }
    return validate(data);
  } catch {
    return null;
  } finally {
    window.clearTimeout(timer);
  }
}

// ---------- validators (the Worker validates too; never trust the network) ----------
const LABEL_TO_TAG: Record<string, TagKind> = {
  'Case fact': 'case',
  'Verified source': 'verified',
  Proposal: 'proposal',
  'Demo data': 'demo',
  'Needs confirmation': 'confirm',
};
export const TOUR_IDS: TourId[] = ['charyn', 'kolsai', 'turkestan', 'burabay'];
const INTERESTS: Interest[] = ['nature', 'photography', 'culture', 'adventure', 'relaxation'];
const ROUTES = ['/tours', '/tour/charyn', '/tour/kolsai', '/tour/turkestan', '/tour/burabay', '/book', '/plan', '/trust', '/trip', '/postcard', 'handoff'];

const obj = (x: unknown): Record<string, unknown> | null => (x && typeof x === 'object' && !Array.isArray(x) ? (x as Record<string, unknown>) : null);
const text = (v: unknown, max: number) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null);
const list = <T extends string>(v: unknown, allowed: readonly T[]): T[] =>
  Array.isArray(v) ? [...new Set(v.filter((x): x is T => allowed.includes(x as T)))] : [];
const tags = (v: unknown): TagKind[] => (Array.isArray(v) ? [...new Set(v.map((x) => LABEL_TO_TAG[x as string]).filter(Boolean))] : []);

export type AiChat = { answer: string; tags: TagKind[]; routes: string[]; blocked?: number[] };
export const validateChat = (x: unknown): AiChat | null => {
  const o = obj(x);
  // The price guard rejected the reply: the caller shows its checked answer and offers the manager.
  if (o && o.blocked) return { answer: '', tags: [], routes: ['handoff'], blocked: Array.isArray(o.numbers) ? o.numbers.filter((n): n is number => typeof n === 'number') : [] };
  const answer = o && text(o.answer, 1200);
  return o && answer ? { answer, tags: tags(o.labels), routes: list(o.actions, ROUTES).slice(0, 3) } : null;
};

export type AiPlan = { destinations: TourId[]; days: number; travelers: number; interests: Interest[]; budget: 'budget' | 'comfort' | 'premium' | 'unknown'; note: string };
export const validatePlan = (x: unknown): AiPlan | null => {
  const o = obj(x);
  if (!o || !Array.isArray(o.destinations) || !Array.isArray(o.interests)) return null;
  const int = (v: unknown, hi: number) => (Number.isInteger(v) && (v as number) > 0 && (v as number) <= hi ? (v as number) : 0);
  const budget = (['budget', 'comfort', 'premium'] as const).find((b) => b === o.budget) ?? 'unknown';
  return { destinations: list(o.destinations, TOUR_IDS), days: int(o.days, 30), travelers: int(o.travelers, 12), interests: list(o.interests, INTERESTS), budget, note: text(o.note, 300) ?? '' };
};

export type AiCaptions = { zh: string[]; en: string[] };
const strs = (v: unknown, max: number) => (Array.isArray(v) ? v.map((s) => text(s, max)).filter((s): s is string => !!s).slice(0, 3) : []);
export const validateCaptions = (x: unknown): AiCaptions | null => {
  const o = obj(x);
  if (!o) return null;
  const zh = strs(o.zh, 80);
  const en = strs(o.en, 160);
  return zh.length && en.length ? { zh, en } : null;
};

export type AiTranslation = { text: string; pinyin: string };
export const validateTranslation = (x: unknown): AiTranslation | null => {
  const o = obj(x);
  const t = o && text(o.text, 1200);
  return o && t ? { text: t, pinyin: text(o.pinyin, 1200) ?? '' } : null;
};

export type AiManager = { summaryRu: string; reply: string; checkRu: string[]; tags: TagKind[] };
export const validateManager = (x: unknown): AiManager | null => {
  const o = obj(x);
  const summaryRu = o && text(o.summary_ru, 600);
  const reply = o && text(o.reply, 1500);
  return o && summaryRu && reply ? { summaryRu, reply, checkRu: strs(o.check_ru, 200), tags: tags(o.labels) } : null;
};
