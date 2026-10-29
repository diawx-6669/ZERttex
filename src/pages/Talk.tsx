import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Icon } from '../components/Icon';
import { PageHead, Section } from '../components/Layout';
import { AiTag, Scope, Tag } from '../components/Tag';
import { matchPhrase, phrasebook, type Phrase } from '../data/phrasebook';
import { aiLive, callAi, useAiMode, validateTranslation } from '../lib/ai';
import { canListen, listen, speak, stopSpeaking } from '../lib/speech';
import { useApp } from '../state';

// In-trip translator: Chinese-speaking traveler ↔ Russian-speaking guide.
// 1. Conversation: speak or type; the live AI translates (any sentence). Without AI or
//    without internet, the closest phrasebook entry is used, and we say so.
// 2. Phrasebook: works fully offline (it is part of the page), with spoken audio
//    when the phone has a Chinese / Russian voice, and a big "show" mode.

type Side = 'zh' | 'ru';
type Line = { id: number; from: Side; text: string; out: string; pinyin?: string; source: 'ai' | 'phrasebook' | 'none' };

const sideInfo = {
  zh: { who: { en: 'Traveler · 中文', zh: '游客 · 中文' }, speech: 'zh-CN' as const, place: '例如：还要多久到？' },
  ru: { who: { en: 'Guide · Русский', zh: '导游 · 俄语' }, speech: 'ru-RU' as const, place: 'Например: Через 20 минут остановка' },
};

export default function Talk() {
  const { t, toast } = useApp();
  const mode = useAiMode();
  const [lines, setLines] = useState<Line[]>([]);
  const [busy, setBusy] = useState<Side | null>(null);
  const [listening, setListening] = useState<Side | null>(null);
  const [draft, setDraft] = useState<Record<Side, string>>({ zh: '', ru: '' });
  const [group, setGroup] = useState(phrasebook[0].id);
  const [show, setShow] = useState<{ text: string; sub?: string; lang: Side } | null>(null);
  const stopRef = useRef<() => void>(() => {});
  const idRef = useRef(1);
  const logRef = useRef<HTMLOListElement>(null);

  useEffect(() => {
    logRef.current?.lastElementChild?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [lines]);
  useEffect(() => () => (stopRef.current(), stopSpeaking()), []);

  const say = async (text: string, lang: Side, quiet = false) => {
    const r = await speak(text, sideInfo[lang].speech, () => {});
    if (r !== 'ok' && !quiet) toast(t({ en: 'No voice for this language on this device. Show the text instead.', zh: '此设备没有该语言的语音，请直接出示文字。' }));
  };

  const translate = async (from: Side, text: string) => {
    const q = text.trim();
    if (!q) return;
    const to: Side = from === 'zh' ? 'ru' : 'zh';
    setBusy(from);
    let line: Line = { id: idRef.current++, from, text: q, out: '', source: 'none' };
    const ai = aiLive() && navigator.onLine ? await callAi('translate', { from, to, text: q }, validateTranslation) : null;
    if (ai) line = { ...line, out: ai.text, pinyin: to === 'zh' ? ai.pinyin : undefined, source: 'ai' };
    else {
      const p = matchPhrase(q, from);
      if (p) line = { ...line, out: to === 'ru' ? p.ru : p.zh, pinyin: to === 'zh' ? p.py : undefined, source: 'phrasebook' };
    }
    setLines((l) => [...l, line]);
    setBusy(null);
    if (line.out) say(line.out, to, true);
  };

  const mic = (side: Side) => {
    if (listening) {
      stopRef.current();
      return;
    }
    setListening(side);
    stopRef.current = listen(
      sideInfo[side].speech,
      (text) => translate(side, text),
      (err) => {
        setListening(null);
        if (err && err !== 'no-speech' && err !== 'aborted') toast(t({ en: 'Voice input is not available here. Type instead.', zh: '此处无法使用语音输入，请改为打字。' }));
      },
    );
  };

  const submit = (side: Side) => (e: FormEvent) => {
    e.preventDefault();
    translate(side, draft[side]);
    setDraft((d) => ({ ...d, [side]: '' }));
  };

  const g = phrasebook.find((x) => x.id === group)!;

  return (
    <>
      <PageHead
        eyebrow={<>{t({ en: 'In the trip', zh: '旅途中' })}</>}
        title={t({ en: 'Talk with your guide', zh: '与导游对话' })}
        sub={t({ en: 'You speak Chinese, your guide speaks Russian. Say it or type it, we translate both ways. The phrasebook works without internet.', zh: '您说中文，导游说俄语。说出来或打字，双向翻译。常用语手册无需网络。' })}
      />

      <Section title={t({ en: 'Conversation', zh: '对话翻译' })} sub={t({ en: 'Hold the phone between you. Each side has its own button.', zh: '把手机放在你们中间，每一方有自己的按钮。' })} right={<Scope phase="p2" />}>
        <div className="card overflow-hidden" data-testid="talk">
          <div className="flex flex-wrap items-center gap-2 border-b-2 border-edge bg-surface2 px-4 py-2.5 text-xs">
            {mode === 'live' ? <AiTag /> : <span className="font-semibold text-muted">{t({ en: 'No live AI here: phrasebook matches only.', zh: '当前无实时 AI：仅匹配常用语。' })}</span>}
            {!canListen() && <span className="text-muted">{t({ en: '· Voice input not supported in this browser: type instead.', zh: '· 此浏览器不支持语音输入，请打字。' })}</span>}
          </div>
          <ol ref={logRef} className="max-h-[420px] min-h-[160px] space-y-3 overflow-y-auto p-4" aria-live="polite">
            {lines.length === 0 && <li className="py-8 text-center text-sm text-muted">{t({ en: 'Tap a microphone or type below.', zh: '点击麦克风或在下方输入。' })}</li>}
            {lines.map((l) => (
              <li key={l.id} className={`flex ${l.from === 'zh' ? 'justify-start' : 'justify-end'}`}>
                <div className="max-w-[88%] sm:max-w-[70%]">
                  <div className={`rounded-[12px] border-2 border-edge p-3 ${l.from === 'zh' ? 'bg-surface' : 'bg-sun/40'}`}>
                    <div className="text-sm text-muted" lang={l.from === 'zh' ? 'zh-CN' : 'ru'}>{l.text}</div>
                    {l.out ? (
                      <>
                        <div className="mt-1 text-xl font-bold leading-snug" lang={l.from === 'zh' ? 'ru' : 'zh-CN'}>{l.out}</div>
                        {l.pinyin && <div className="text-sm text-muted">{l.pinyin}</div>}
                      </>
                    ) : (
                      <div className="mt-1 text-sm font-semibold text-warn">{t({ en: 'Not in the phrasebook. Connect to the internet for full translation.', zh: '常用语中没有这句。联网后可完整翻译。' })}</div>
                    )}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs">
                    {l.source === 'ai' && <AiTag />}
                    {l.source === 'phrasebook' && <span className="rounded-full border border-ok/50 px-2 py-px font-semibold text-ok">{t({ en: 'Phrasebook · offline', zh: '常用语 · 离线' })}</span>}
                    {l.out && (
                      <>
                        <button type="button" className="chip !min-h-[28px] !py-0.5 text-xs" onClick={() => say(l.out, l.from === 'zh' ? 'ru' : 'zh')}><Icon name="volume" size={13} /></button>
                        <button type="button" className="chip !min-h-[28px] !py-0.5 text-xs" onClick={() => setShow({ text: l.out, sub: l.pinyin, lang: l.from === 'zh' ? 'ru' : 'zh' })}>{t({ en: 'Show', zh: '出示' })}</button>
                      </>
                    )}
                  </div>
                </div>
              </li>
            ))}
            {busy && <li className="typing flex gap-1 px-2 text-2xl leading-none text-muted" aria-label="translating"><span>•</span><span>•</span><span>•</span></li>}
          </ol>
          <div className="grid gap-0 border-t-2 border-edge md:grid-cols-2">
            {(['zh', 'ru'] as Side[]).map((side) => (
              <form key={side} onSubmit={submit(side)} className={`space-y-2 p-4 ${side === 'ru' ? 'border-t-2 border-edge bg-sun/15 md:border-l-2 md:border-t-0' : ''}`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-bold uppercase tracking-wider">{t(sideInfo[side].who)}</span>
                  <button
                    type="button"
                    onClick={() => mic(side)}
                    disabled={!canListen() || (listening !== null && listening !== side)}
                    aria-pressed={listening === side}
                    data-testid={`mic-${side}`}
                    className={`btn-sm ${listening === side ? 'btn-sun animate-pulse' : 'btn-primary'}`}
                  >
                    <Icon name={listening === side ? 'stop' : 'volume'} size={14} />
                    {listening === side ? (side === 'zh' ? '停止' : 'Стоп') : side === 'zh' ? '按下说话' : 'Говорить'}
                  </button>
                </div>
                <div className="flex gap-2">
                  <label className="sr-only" htmlFor={`talk-${side}`}>{t(sideInfo[side].who)}</label>
                  <input id={`talk-${side}`} lang={side === 'zh' ? 'zh-CN' : 'ru'} className="input" value={draft[side]} placeholder={sideInfo[side].place} onChange={(e) => setDraft((d) => ({ ...d, [side]: e.target.value }))} />
                  <button type="submit" className="btn-dark !px-3" disabled={!draft[side].trim() || busy !== null} aria-label={side === 'zh' ? '翻译' : 'Перевести'}><Icon name="arrow" /></button>
                </div>
              </form>
            ))}
          </div>
        </div>
        <p className="mt-3 text-xs text-muted">
          {t({ en: 'Voice input uses the phone’s own speech service (on Android/Chrome it needs Google, which does not work in mainland China; on iPhone it uses Apple). Typing and the phrasebook always work.', zh: '语音输入使用手机自带服务（安卓/Chrome 依赖 Google，在中国大陆不可用；iPhone 使用 Apple）。打字和常用语始终可用。' })}
        </p>
      </Section>

      <Section title={t({ en: 'Phrasebook · works offline', zh: '常用语手册 · 离线可用' })} sub={t({ en: 'Tap 🔊 to play it aloud, or “Show” to hold up big text for the guide.', zh: '点 🔊 朗读，或点「出示」把大字给导游看。' })} right={<Scope phase="mvp" />}>
        <div className="-mx-4 mb-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <div className="flex min-w-max gap-2" role="tablist" aria-label={t({ en: 'Topics', zh: '主题' })}>
            {phrasebook.map((x) => (
              <button key={x.id} type="button" role="tab" aria-selected={group === x.id} onClick={() => setGroup(x.id)} className={`chip ${group === x.id ? '!bg-sun !text-sunInk shadow-hard-sm' : ''}`}>
                <Icon name={x.icon} size={15} className="mr-1.5" /> {t(x.name)}
              </button>
            ))}
          </div>
        </div>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" data-testid="phrasebook">
          {g.phrases.map((p: Phrase) => {
            const first: Side = g.dir === 'guide' ? 'ru' : 'zh';
            const other: Side = first === 'zh' ? 'ru' : 'zh';
            const text = (s: Side) => (s === 'zh' ? p.zh : p.ru);
            return (
              <li key={p.zh} className="card-flat flex flex-col p-4">
                <div className="text-xl font-bold leading-snug" lang={first === 'zh' ? 'zh-CN' : 'ru'}>{text(first)}</div>
                {first === 'zh' && <div className="text-sm text-muted">{p.py}</div>}
                <div className="mt-2 text-[15px] font-semibold text-teal" lang={other === 'zh' ? 'zh-CN' : 'ru'}>{text(other)}</div>
                {other === 'zh' && <div className="text-sm text-muted">{p.py}</div>}
                <div className="text-xs text-muted">{p.en}</div>
                <div className="mt-3 flex flex-wrap gap-1.5 pt-1">
                  <button type="button" className="chip !min-h-[30px] !py-0.5 text-xs" onClick={() => say(p.zh, 'zh')}><Icon name="volume" size={13} className="mr-1" />中文</button>
                  <button type="button" className="chip !min-h-[30px] !py-0.5 text-xs" onClick={() => say(p.ru, 'ru')}><Icon name="volume" size={13} className="mr-1" />Рус</button>
                  <button type="button" className="chip !min-h-[30px] !py-0.5 text-xs" onClick={() => setShow(other === 'ru' ? { text: p.ru, lang: 'ru' } : { text: p.zh, sub: p.py, lang: 'zh' })}>{t({ en: 'Show', zh: '出示' })}</button>
                </div>
              </li>
            );
          })}
        </ul>
        <div className="mt-3"><Tag kind="confirm" extra={t({ en: 'native-speaker check before launch', zh: '上线前由母语者校对' })} /></div>
      </Section>

      {show && (
        <button type="button" className="fixed inset-0 z-[70] grid place-items-center bg-sun p-6 text-center text-sunInk" onClick={() => setShow(null)} aria-label={t({ en: 'Close', zh: '关闭' })} data-testid="show-mode">
          <span>
            <span className="block text-[clamp(2.2rem,9vw,5.5rem)] font-black leading-tight" lang={show.lang === 'zh' ? 'zh-CN' : 'ru'}>{show.text}</span>
            {show.sub && <span className="mt-3 block text-2xl">{show.sub}</span>}
            <span className="mt-8 block font-mono text-xs font-bold uppercase tracking-widest">{t({ en: 'Tap to close', zh: '点击关闭' })}</span>
          </span>
        </button>
      )}
    </>
  );
}
