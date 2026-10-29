import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { L, Lang, TourId } from './data/types';
import { addDays, toIso } from './lib/tripBuilder';

export type BookingItem = { tourId: TourId | ''; date: string };
export type PayMethod = 'card' | 'alipay' | 'wechat' | '';

export type BookingDraft = {
  items: BookingItem[];
  travelers: number;
  name: string;
  email: string;
  country: string;
  guideLang: 'en' | 'zh' | '';
  method: PayMethod;
  fromPlan: boolean;
  /** Group booking: every traveler pays their own share. */
  split: boolean;
};

export type Booking = BookingDraft & { code: string; total: number; createdAt: string };

type Toast = { id: number; text: string };

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (l: L) => string;
  large: boolean;
  setLarge: (b: boolean) => void;
  draft: BookingDraft;
  setDraft: (d: Partial<BookingDraft>) => void;
  resetDraft: (items?: BookingItem[], extra?: Partial<BookingDraft>) => void;
  booking: Booking | null;
  setBooking: (b: Booking | null) => void;
  toasts: Toast[];
  toast: (text: string) => void;
};

const AppCtx = createContext<Ctx | null>(null);

const read = (k: string) => {
  try {
    return window.localStorage.getItem(k);
  } catch {
    return null;
  }
};
const write = (k: string, v: string) => {
  try {
    window.localStorage.setItem(k, v);
  } catch {
    /* storage unavailable: ignore */
  }
};

export const minBookDate = () => addDays(toIso(new Date()), 7);
export const defaultTripDate = () => addDays(toIso(new Date()), 21);

const emptyDraft = (items?: BookingItem[]): BookingDraft => ({
  items: items ?? [{ tourId: '', date: defaultTripDate() }],
  travelers: 2,
  name: '',
  email: '',
  country: '',
  guideLang: '',
  method: '',
  fromPlan: false,
  split: false,
});

export function AppProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => (read('sg.lang') === 'zh' ? 'zh' : 'en'));
  const [large, setLargeState] = useState<boolean>(() => read('sg.large') === '1');
  const [draft, setDraftState] = useState<BookingDraft>(() => emptyDraft());
  const [booking, setBooking] = useState<Booking | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  useEffect(() => {
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
    write('sg.lang', lang);
  }, [lang]);
  useEffect(() => {
    document.documentElement.classList.toggle('large-text', large);
    write('sg.large', large ? '1' : '0');
  }, [large]);

  const toast = useCallback((text: string) => {
    const id = nextId.current++;
    setToasts((ts) => [...ts, { id, text }]);
    setTimeout(() => setToasts((ts) => ts.filter((x) => x.id !== id)), 3800);
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      lang,
      setLang: setLangState,
      t: (l: L) => l[lang],
      large,
      setLarge: setLargeState,
      draft,
      setDraft: (d) => setDraftState((p) => ({ ...p, ...d })),
      resetDraft: (items, extra) => setDraftState({ ...emptyDraft(items), ...extra }),
      booking,
      setBooking,
      toasts,
      toast,
    }),
    [lang, large, draft, booking, toasts, toast],
  );

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export function useApp() {
  const c = useContext(AppCtx);
  if (!c) throw new Error('useApp outside AppProvider');
  return c;
}
