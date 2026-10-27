// Browser side of the optional live AI (worker/). The API key never reaches the
// browser: we only know the Worker URL, set at build time in VITE_AI_ENDPOINT.
// Every call returns null on any problem (no endpoint, forced scripted mode,
// network error, > 8 s, non-200, invalid JSON, wrong shape) and the caller then
// uses its existing scripted logic. Nothing throws into the UI.
import { useSyncExternalStore } from 'react';
import type { Interest, TagKind, TourId } from '../data/types';

const ENDPOINT = String(import.meta.env.VITE_AI_ENDPOINT ?? '').trim().replace(/\/+$/, '');
export const aiConfigured = /^https?:\/\/\S+$/.test(ENDPOINT);
export const AI_TIMEOUT_MS = 8000;

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
export const aiLive = () => aiConfigured && !forced;
export type AiMode = 'live' | 'scripted';
export const useAiMode = (): AiMode => useSyncExternalStore(subscribe, () => (aiLive() ? 'live' : 'scripted'));
export const useForceScripted = () => useSyncExternalStore(subscribe, () => forced);

// ---------- transport ----------
export async function callAi<T>(path: 'chat' | 'plan' | 'caption' | 'manager', body: object, validate: (x: unknown) => T | null): Promise<T | null> {
  if (!aiLive()) return null;
  const ctrl = new AbortController();
  const timer = window.setTimeout(() => ctrl.abort(), AI_TIMEOUT_MS);
  try {
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

export type AiChat = { answer: string; tags: TagKind[]; routes: string[] };
export const validateChat = (x: unknown): AiChat | null => {
  const o = obj(x);
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

export type AiManager = { summaryRu: string; reply: string; checkRu: string[]; tags: TagKind[] };
export const validateManager = (x: unknown): AiManager | null => {
  const o = obj(x);
  const summaryRu = o && text(o.summary_ru, 600);
  const reply = o && text(o.reply, 1500);
  return o && summaryRu && reply ? { summaryRu, reply, checkRu: strs(o.check_ru, 200), tags: tags(o.labels) } : null;
};
