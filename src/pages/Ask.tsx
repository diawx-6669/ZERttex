import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Icon } from '../components/Icon';
import { PageHead } from '../components/Layout';
import { Tag } from '../components/Tag';
import { ui } from '../data/i18n';
import { tourById } from '../data/tours';
import { answer, type BotAnswer, type ChatAction } from '../lib/concierge';
import { navigate } from '../lib/router';
import { useApp } from '../state';

type Msg = { id: number; from: 'user' | 'bot'; text: string; a?: BotAnswer; greet?: boolean };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function Ask({ query }: { query: URLSearchParams }) {
  const { t, lang, toast } = useApp();
  const [msgs, setMsgs] = useState<Msg[]>(() => [{ id: 0, from: 'bot', text: '', greet: true }]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [handoff, setHandoff] = useState<{ open: boolean; question: string }>({ open: false, question: '' });
  const [hEmail, setHEmail] = useState('');
  const [hErr, setHErr] = useState('');
  const idRef = useRef(1);
  const listRef = useRef<HTMLDivElement>(null);
  const asked = useRef(false);

  const ask = (text: string) => {
    const q = text.trim();
    if (!q) return;
    const userMsg: Msg = { id: idRef.current++, from: 'user', text: q };
    setMsgs((m) => [...m, userMsg]);
    setInput('');
    setTyping(true);
    window.setTimeout(() => {
      const a = answer(q, lang);
      setMsgs((m) => [...m, { id: idRef.current++, from: 'bot', text: a.text, a }]);
      setTyping(false);
      if (a.handoff) setHandoff({ open: true, question: q });
    }, 550);
  };

  // Auto-ask about a tour when arriving from a tour page.
  useEffect(() => {
    const tour = tourById(query.get('tour') ?? undefined);
    const q = query.get('q');
    if (asked.current) return;
    if (tour) {
      asked.current = true;
      ask(lang === 'zh' ? `「${tour.name.zh}」包含什么？` : `What's included in ${tour.name.en}?`);
    } else if (q) {
      asked.current = true;
      ask(q);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [msgs, typing, handoff.open]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    ask(input);
  };

  const runAction = (a: ChatAction, lastQ: string) => {
    if (a.kind === 'tour') navigate(`/tour/${a.id}`);
    if (a.kind === 'book') navigate(a.id ? `/book?tour=${a.id}` : '/book');
    if (a.kind === 'trust') navigate('/trust');
    if (a.kind === 'plan') navigate('/plan');
    if (a.kind === 'manager') setHandoff({ open: true, question: lastQ });
  };

  const actionLabel = (a: ChatAction) => {
    if (a.kind === 'tour') return `${t(ui.ask.openTour)}: ${t(tourById(a.id)!.name)}`;
    if (a.kind === 'book') return t(ui.ask.startBooking);
    if (a.kind === 'trust') return t(ui.ask.openTrust);
    if (a.kind === 'plan') return t(ui.ask.openPlan);
    return t(ui.ask.manager);
  };

  const sendHandoff = (e: FormEvent) => {
    e.preventDefault();
    if (!EMAIL_RE.test(hEmail.trim())) {
      setHErr(t(ui.book.errEmail));
      return;
    }
    setHErr('');
    setHandoff({ open: false, question: '' });
    setHEmail('');
    toast(t(ui.ask.sent));
    setMsgs((m) => [...m, { id: idRef.current++, from: 'bot', text: t(ui.ask.sent), a: { text: t(ui.ask.sent), lang, tag: 'proposal', intent: 'sent' } }]);
  };

  const lastUserQ = [...msgs].reverse().find((m) => m.from === 'user')?.text ?? '';
  const chips = ui.ask.chips[lang];

  return (
    <>
      <PageHead loop={2} title={t(ui.ask.title)} sub={t(ui.ask.sub)}>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-teal px-2.5 py-1 font-mono text-[11px] font-semibold uppercase tracking-wide text-teal">
          <Icon name="info" size={13} /> {t(ui.ask.scripted)}
        </span>
      </PageHead>

      <div className="container-x mt-6 grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="card flex h-[min(72vh,680px)] min-h-[460px] flex-col overflow-hidden">
          <div className="flex items-center justify-between gap-2 border-b border-line bg-night px-4 py-3 text-nightInk">
            <div className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-teal text-tealInk">
                <Icon name="chat" />
              </span>
              <div className="leading-tight">
                <div className="font-semibold">{t(ui.ask.bot)}</div>
                <div className="font-mono text-[10.5px] uppercase tracking-wide text-nightInk/70">EN · 中文 · {t(ui.ask.scripted)}</div>
              </div>
            </div>
            <button
              type="button"
              className="rounded-full px-3 py-1.5 text-xs font-semibold text-nightInk/80 hover:bg-white/10"
              onClick={() => {
                setMsgs([{ id: idRef.current++, from: 'bot', text: '', greet: true }]);
                setHandoff({ open: false, question: '' });
              }}
            >
              {t(ui.ask.reset)}
            </button>
          </div>

          <div ref={listRef} className="flex-1 space-y-4 overflow-y-auto p-4" role="log" aria-live="polite" aria-label={t(ui.ask.title)}>
            {msgs.map((m) => (
              <div key={m.id} className={`flex ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[88%] sm:max-w-[78%] ${m.from === 'user' ? 'items-end' : ''}`}>
                  <div className="mb-1 font-mono text-[10.5px] uppercase tracking-wide text-muted">
                    {m.from === 'user' ? t(ui.ask.you) : t(ui.ask.bot)}
                  </div>
                  <div
                    lang={m.a?.lang === 'zh' ? 'zh-CN' : undefined}
                    className={`whitespace-pre-line rounded-2xl px-4 py-3 text-[15px] ${m.from === 'user' ? 'rounded-br-md bg-teal text-tealInk' : 'rounded-bl-md border border-line bg-surface2'}`}
                  >
                    {m.greet ? t(ui.ask.greeting) : m.text}
                  </div>
                  {m.a && (m.a.tag || m.a.actions?.length) ? (
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      {m.a.tag && <Tag kind={m.a.tag} />}
                      {m.a.actions?.map((a, i) => (
                        <button key={i} type="button" className="chip !min-h-[32px] !py-1 text-xs" onClick={() => runAction(a, lastUserQ)}>
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
              <form onSubmit={sendHandoff} className="rise rounded-2xl border border-gold/50 bg-gold/10 p-4" noValidate>
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

          <div className="border-t border-line p-3">
            <div className="-mx-3 mb-2 overflow-x-auto px-3">
              <div className="flex min-w-max gap-1.5" role="group" aria-label={t(ui.ask.quick)}>
                {chips.map((c) => (
                  <button key={c} type="button" className="chip !min-h-[34px] text-xs" onClick={() => ask(c)}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <form onSubmit={onSubmit} className="flex gap-2">
              <label htmlFor="chat-input" className="sr-only">{t(ui.ask.placeholder)}</label>
              <input
                id="chat-input"
                className="input flex-1"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t(ui.ask.placeholder)}
                autoComplete="off"
              />
              <button type="submit" className="btn-primary" disabled={!input.trim()}>
                <Icon name="arrow" /> <span className="hidden sm:inline">{t(ui.ask.send)}</span>
              </button>
            </form>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="card p-5 text-sm">
            <h2 className="mb-2 font-display text-lg font-bold">{t({ en: 'How this concierge behaves', zh: '助手的行为准则' })}</h2>
            <ul className="space-y-2 text-muted">
              {[
                { en: 'Detects English or Chinese from your question and replies in the same language.', zh: '自动识别中文或英文提问，并用同一语言回复。' },
                { en: 'Answers only from tour data and the verified visa source.', zh: '仅依据线路数据和已核实的签证来源回答。' },
                { en: 'Never invents availability, discounts, licences or insurance.', zh: '绝不编造余位、折扣、许可证或保险信息。' },
                { en: 'When unsure, says "I won’t guess" and hands you to a manager.', zh: '不确定时会说"我不会乱猜"，并为您转接人工。' },
              ].map((x, i) => (
                <li key={i} className="flex gap-2">
                  <Icon name="check" size={16} className="mt-0.5 text-teal" />
                  {t(x)}
                </li>
              ))}
            </ul>
          </div>
          <div className="card p-5 text-sm">
            <h2 className="mb-2 font-display text-lg font-bold">{t({ en: 'Try these', zh: '试试这些' })}</h2>
            <div className="flex flex-wrap gap-1.5">
              {['科尔赛湖包含什么？', 'Is Kolsai available on 3 May?', '有中文导游吗？', 'Can I get a discount?', '护照需要吗？'].map((c) => (
                <button key={c} type="button" className="chip !min-h-[32px] text-xs" onClick={() => ask(c)}>
                  {c}
                </button>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
