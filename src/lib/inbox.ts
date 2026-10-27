// Manager inbox: questions the concierge handed off to a human.
// Stored only in this browser (localStorage). The seed rows are DEMO DATA so the
// staff screen is not empty on stage; they are always labelled as such.
import { useSyncExternalStore } from 'react';
import type { Lang, TourId } from '../data/types';

export type InboxStatus = 'new' | 'answered';
export type InboxItem = {
  id: string;
  question: string;
  email: string;
  lang: Lang;
  tourId?: TourId;
  createdAt: string;
  status: InboxStatus;
  demo?: boolean;
  /** Text the manager approved and "sent" (simulated). */
  sentReply?: string;
};

const KEY = 'sg.inbox';

const seed: InboxItem[] = [
  { id: 'demo-1', question: '5月3日科尔赛湖线路还有两个位置吗？', email: 'traveler.demo1@example.com', lang: 'zh', tourId: 'kolsai', createdAt: '2026-10-20T09:12:00Z', status: 'new', demo: true },
  { id: 'demo-2', question: 'Is the Kaindy 4x4 transfer included, and how much is the park fee?', email: 'traveler.demo2@example.com', lang: 'en', tourId: 'kolsai', createdAt: '2026-10-21T14:40:00Z', status: 'new', demo: true },
  { id: 'demo-3', question: '突厥斯坦线路可以安排中文导游吗？', email: 'traveler.demo3@example.com', lang: 'zh', tourId: 'turkestan', createdAt: '2026-10-22T06:05:00Z', status: 'new', demo: true },
];

const load = (): InboxItem[] => {
  try {
    const raw = window.localStorage.getItem(KEY);
    const real = raw ? (JSON.parse(raw) as InboxItem[]) : [];
    return Array.isArray(real) ? real : [];
  } catch {
    return [];
  }
};

let items: InboxItem[] = load();
let demoState: Record<string, Partial<InboxItem>> = {};
let snapshot: InboxItem[] = [];
const subs = new Set<() => void>();
const rebuild = () => {
  snapshot = [...items, ...seed.map((s) => ({ ...s, ...demoState[s.id] }))].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
};
rebuild();
const emit = () => {
  rebuild();
  try {
    window.localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    /* ignore */
  }
  subs.forEach((f) => f());
};

export function addToInbox(q: { question: string; email: string; lang: Lang; tourId?: TourId }) {
  items = [{ ...q, id: `q-${Date.now().toString(36)}`, createdAt: new Date().toISOString(), status: 'new' }, ...items];
  emit();
}

export function markAnswered(id: string, sentReply: string) {
  if (id.startsWith('demo-')) demoState = { ...demoState, [id]: { status: 'answered', sentReply } };
  else items = items.map((i) => (i.id === id ? { ...i, status: 'answered', sentReply } : i));
  emit();
}

export const useInbox = () =>
  useSyncExternalStore(
    (f) => (subs.add(f), () => subs.delete(f)),
    () => snapshot,
  );
