import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { ui } from '../data/i18n';
import { tourById } from '../data/tours';
import type { TourId } from '../data/types';
import { aiLive, callAi, validateChat, type AiChat } from '../lib/ai';
import { answer, detectLang, findTour, type BotAnswer, type ChatAction } from '../lib/concierge';
import { addToInbox } from '../lib/inbox';
import { navigate } from '../lib/router';
import { useApp } from '../state';
import { Icon } from './Icon';
import { AiModeBadge, AiTag, Scope, Tag } from './Tag';

// One conversation shared by the Ask page and the slide-in drawer,
// so a traveler never loses the thread when moving between screens.

type Msg = { id: number; from: 'user' | 'bot'; text: string; a?: BotAnswer; greet?: boolean };
type Handoff = { open: boolean; question: string };

type ChatCtx = {
  msgs: Msg[];
  typing: boolean;
  handoff: Handoff;
  setHandoff: (h: Handoff) => void;
  ask: (text: string) => void;
  reset: () => void;
  pushBot: (text: string, a?: BotAnswer) => void;
  drawer: boolean;
  openChat: (question?: string) => void;
  closeChat: () => void;
};

const Ctx = createContext<ChatCtx | null>(null);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function ChatProvider({ children }: { children: ReactNode }) {
  const { lang } = useApp();
  const [msgs, setMsgs] = useState<Msg[]>([{ id: 0, from: 'bot', text: '', greet: true }]);
  const [typing, setTyping] = useState(false);
  const [handoff, setHandoff] = useState<Handoff>({ open: false, question: '' });
  const [drawer, setDrawer] = useState(false);
  const idRef = useRef(1);
  const langRef = useRef(lang);
  langRef.current = lang;

  const msgsRef = useRef(msgs);
  msgsRef.current = msgs;

  const ask = useCallback(async (text: string) => {
    const q = text.trim();
    if (!q) return;
    setMsgs((m) => [...m, { id: idRef.current++, from: 'user', text: q }]);
    setTyping(true);
    const scripted = answer(q, langRef.current);
    let a: BotAnswer = scripted;
    if (aiLive()) {
      const history = msgsRef.current.filter((m) => !m.greet && m.text).slice(-6).map((m) => ({ from: m.from, text: m.text }));
      const live = await callAi('chat', { question: q, lang: scripted.lang, tourId: findTour(q)?.id, history }, validateChat);
      if (live?.blocked) a = { ...scripted, guard: 'blocked', actions: [...(scripted.actions ?? []).filter((x) => x.kind !== 'manager'), { kind: 'manager' }] };
      else if (live) a = fromAi(live, scripted.lang);
    } else {
      await new Promise((r) => window.setTimeout(r, 550));
    }
    setMsgs((m) => [...m, { id: idRef.current++, from: 'bot', text: a.text, a }]);
    setTyping(false);
    if (a.handoff) setHandoff({ open: true, question: q });
  }, []);

  const value = useMemo<ChatCtx>(
    () => ({
      msgs,
      typing,
      handoff,
      setHandoff,
      ask,
      reset: () => {
        setMsgs([{ id: idRef.current++, from: 'bot', text: '', greet: true }]);
        setHandoff({ open: false, question: '' });
      },
      pushBot: (text, a) => setMsgs((m) => [...m, { id: idRef.current++, from: 'bot', text, a }]),
      drawer,
      openChat: (question) => {
        setDrawer(true);
        if (question) ask(question);
      },
      closeChat: () => setDrawer(false),
    }),
    [msgs, typing, handoff, ask, drawer],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useChat() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useChat outside ChatProvider');
  return c;
}

/** Turns a validated AI reply into the same shape the scripted concierge uses. */
function fromAi(r: AiChat, lang: BotAnswer['lang']): BotAnswer {
  const actions: ChatAction[] = r.routes.map((to): ChatAction => {
    if (to === 'handoff') return { kind: 'manager' };
    if (to.startsWith('/tour/')) return { kind: 'tour', id: to.slice(6) as TourId };
    if (to === '/book') return { kind: 'book' };
    if (to === '/plan') return { kind: 'plan' };
    if (to === '/trust') return { kind: 'trust' };
    return { kind: 'route', to: to as '/tours' | '/trip' | '/postcard' };
  });
  return { text: r.answer, lang, actions, intent: 'ai', ai: true, tags: r.tags, guard: 'passed' };
}

/** Question the concierge auto-asks when opened from a tour. */
export const tourQuestion = (id: string, lang: 'en' | 'zh') => {
  const tour = tourById(id)!;
  return lang === 'zh' ? `「${tour.name.zh}」包含什么？` : `What's included in ${tour.name.en}?`;
};

export function ChatPanel({ className = '', onClose }: { className?: string; onClose?: () => void }) {
  const { t, lang, toast } = useApp();
  const { msgs, typing, handoff, setHandoff, ask, reset, pushBot, closeChat } = useChat();
  const [input, setInput] = useState('');
  const [hEmail, setHEmail] = useState('');
  const [hErr, setHErr] = useState('');
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [msgs, typing, handoff.open]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    ask(input);
    setInput('');
  };

  const lastQ = [...msgs].reverse().find((m) => m.from === 'user')?.text ?? '';

  const runAction = (a: ChatAction) => {
    const go = (to: string) => {
      closeChat();
      navigate(to);
    };
    if (a.kind === 'tour') go(`/tour/${a.id}`);
    if (a.kind === 'book') go(a.id ? `/book?tour=${a.id}` : '/book');
    if (a.kind === 'trust') go('/trust');
    if (a.kind === 'plan') go('/plan');
    if (a.kind === 'manager') setHandoff({ open: true, question: lastQ });
    if (a.kind === 'route') go(a.to);
  };

  const actionLabel = (a: ChatAction) => {
    if (a.kind === 'tour') return `${t(ui.ask.openTour)}: ${t(tourById(a.id)!.name)}`;
    if (a.kind === 'book') return t(ui.ask.startBooking);
    if (a.kind === 'trust') return t(ui.ask.openTrust);
    if (a.kind === 'plan') return t(ui.ask.openPlan);
    if (a.kind === 'route') return t(a.to === '/tours' ? ui.nav.tours : a.to === '/trip' ? ui.nav.trip : ui.nav.postcard);
    return t(ui.ask.manager);
  };

  const sendHandoff = (e: FormEvent) => {
    e.preventDefault();
    if (!EMAIL_RE.test(hEmail.trim())) {
      setHErr(t(ui.book.errEmail));
      return;
    }
    setHErr('');
    const q = handoff.question.trim() || lastQ;
    if (q) addToInbox({ question: q, email: hEmail.trim(), lang: detectLang(q, lang), tourId: findTour(q)?.id });
    setHandoff({ open: false, question: '' });
    setHEmail('');
    toast(t(ui.ask.sent));
    pushBot(t(ui.ask.sent), { text: t(ui.ask.sent), lang, tag: 'proposal', intent: 'sent' });
  };

  return (
    <div className={`flex flex-col overflow-hidden ${className}`}>
      <div className="flex items-center justify-between gap-2 border-b border-line bg-surface px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-[10px] bg-teal/12 text-teal">
            <Icon name="chat" size={20} />
          </span>
          <div className="leading-tight">
            <div className="flex flex-wrap items-center gap-1.5 font-semibold">{t(ui.ask.bot)} <Scope phase="mvp" /></div>
            <AiModeBadge className="mt-0.5" />
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button type="button" className="rounded-[8px] px-3 py-1.5 text-sm font-medium text-muted hover:bg-surface2 hover:text-ink" onClick={reset}>
            {t(ui.ask.reset)}
          </button>
          {onClose && (
            <button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-[8px] text-muted hover:bg-surface2 hover:text-ink" aria-label={t(ui.nav.close)}>
              <Icon name="x" />
            </button>
          )}
        </div>
      </div>

      <div ref={listRef} className="flex-1 space-y-4 overflow-y-auto overscroll-contain p-4" role="log" aria-live="polite" aria-label={t(ui.ask.title)}>
        {msgs.map((m) => (
          <div key={m.id} className={`rise flex ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className="max-w-[88%] sm:max-w-[80%]">
              <div className={`mb-1 text-xs text-muted ${m.from === 'user' ? 'text-right' : ''}`}>
                {m.from === 'user' ? t(ui.ask.you) : t(ui.ask.bot)}
              </div>
              <div
                lang={m.a?.lang === 'zh' ? 'zh-CN' : undefined}
                className={`whitespace-pre-line rounded-2xl px-4 py-3 text-[15px] ${m.from === 'user' ? 'rounded-br-md border-2 border-edge bg-teal text-tealInk' : 'rounded-bl-md border-2 border-edge bg-surface2'}`}
              >
                {m.greet ? t(ui.ask.greeting) : m.text}
              </div>
              {m.a?.guard && (
                <div data-guard={m.a.guard} className={`mt-1.5 flex items-start gap-1.5 text-xs ${m.a.guard === 'passed' ? 'text-ok' : 'text-warn'}`}>
                  <Icon name={m.a.guard === 'passed' ? 'shieldCheck' : 'shield'} size={14} className="mt-px shrink-0" />
                  {m.a.guard === 'passed'
                    ? t({ en: 'Price check passed: every number is in our verified data.', zh: '价格核对通过：所有数字均来自已核实数据。' })
                    : t({ en: 'The AI reply had a number we could not verify, so it was blocked. Checked answer shown; a manager can confirm.', zh: 'AI 回复中有无法核实的数字，已被拦截。以下为核对过的回答，可转人工确认。' })}
                </div>
              )}
              {m.a && (m.a.tag || m.a.ai || m.a.actions?.length) ? (
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  {m.a.ai && <AiTag />}
                  {m.a.tags?.map((k) => <Tag key={k} kind={k} />)}
                  {m.a.tag && <Tag kind={m.a.tag} />}
                  {m.a.actions?.map((a, i) => (
                    <button key={i} type="button" className="chip !min-h-[32px] !py-1 text-xs" onClick={() => runAction(a)}>
                      {a.kind === 'manager' && <Icon name="users" size={13} className="mr-1" />}
                      {actionLabel(a)}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        ))}
        {typing && (
          <div className="typing flex gap-1 px-2 text-2xl leading-none text-muted" aria-label="typing">
            <span>•</span>
            <span>•</span>
            <span>•</span>
          </div>
        )}
        {handoff.open && (
          <form onSubmit={sendHandoff} className="rise rounded-[14px] border-2 border-edge bg-sun/30 p-4" noValidate>
            <div className="mb-1 flex items-center gap-2 font-semibold">
              <Icon name="users" className="text-gold" /> {t(ui.ask.handoffTitle)}
            </div>
            <p className="mb-3 text-sm text-muted">{t(ui.ask.handoffSub)}</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="h-email">{t(ui.ask.yourEmail)}</label>
                <input
                  id="h-email"
                  type="email"
                  className={`input ${hErr ? 'input-error' : ''}`}
                  value={hEmail}
                  onChange={(e) => setHEmail(e.target.value)}
                  aria-invalid={!!hErr}
                  aria-describedby={hErr ? 'h-email-err' : undefined}
                  autoComplete="email"
                />
                {hErr && <p id="h-email-err" className="mt-1 text-sm text-danger">{hErr}</p>}
              </div>
              <div>
                <label className="label" htmlFor="h-q">{t(ui.ask.yourQuestion)}</label>
                <input id="h-q" className="input" value={handoff.question} onChange={(e) => setHandoff({ open: true, question: e.target.value })} />
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="submit" className="btn-dark btn-sm">
                <Icon name="mail" size={15} /> {t(ui.ask.sendToManager)}
              </button>
              <button type="button" className="btn-ghost btn-sm" onClick={() => setHandoff({ open: false, question: '' })}>
                {t(ui.nav.close)}
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="border-t border-line bg-surface p-3">
        <div className="-mx-3 mb-2 overflow-x-auto px-3">
          <div className="flex min-w-max gap-1.5" role="group" aria-label={t(ui.ask.quick)}>
            {ui.ask.chips[lang].map((c) => (
              <button key={c} type="button" className="chip !min-h-[34px] text-xs" onClick={() => ask(c)}>
                {c}
              </button>
            ))}
          </div>
        </div>
        <form onSubmit={submit} className="flex gap-2">
          <label htmlFor="chat-input" className="sr-only">{t(ui.ask.placeholder)}</label>
          <input id="chat-input" className="input flex-1" value={input} onChange={(e) => setInput(e.target.value)} placeholder={t(ui.ask.placeholder)} autoComplete="off" enterKeyHint="send" />
          <button type="submit" className="btn-primary !px-4" disabled={!input.trim()} aria-label={t(ui.ask.send)}>
            <Icon name="arrow" /> <span className="hidden sm:inline">{t(ui.ask.send)}</span>
          </button>
        </form>
      </div>
    </div>
  );
}

/** Slide-in concierge available from every page. */
export function ChatDrawer() {
  const { t } = useApp();
  const { drawer, closeChat } = useChat();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!drawer) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeChat();
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.setTimeout(() => panelRef.current?.querySelector<HTMLInputElement>('#chat-input')?.focus({ preventScroll: true }), 50);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [drawer, closeChat]);

  if (!drawer) return null;
  return (
    <div className="fixed inset-0 z-[55]" role="dialog" aria-modal="true" aria-label={t(ui.ask.title)}>
      <button type="button" className="absolute inset-0 bg-night/50 backdrop-blur-[2px]" aria-label={t(ui.nav.close)} onClick={closeChat} />
      <div ref={panelRef} className="drawer-in absolute bottom-0 right-0 flex h-[88dvh] w-full flex-col sm:bottom-4 sm:right-4 sm:h-[min(720px,calc(100dvh-2rem))] sm:w-[420px]">
        <ChatPanel className="h-full rounded-t-3xl border border-line bg-surface shadow-2xl sm:rounded-3xl" onClose={closeChat} />
      </div>
    </div>
  );
}
