// Thin wrapper around the browser Web Speech API (speechSynthesis).
// Degrades gracefully: callers get 'unsupported' / 'novoice' and show text instead.

export type SpeakResult = 'ok' | 'unsupported' | 'novoice';

const synth = () => (typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null);

const loadVoices = (): Promise<SpeechSynthesisVoice[]> =>
  new Promise((resolve) => {
    const s = synth();
    if (!s) return resolve([]);
    const v = s.getVoices();
    if (v.length) return resolve(v);
    const done = () => resolve(s.getVoices());
    s.addEventListener?.('voiceschanged', done, { once: true });
    setTimeout(done, 700);
  });

export async function speak(text: string, lang: 'zh-CN' | 'en-US' | 'ru-RU', onEnd: () => void): Promise<SpeakResult> {
  const s = synth();
  if (!s || typeof SpeechSynthesisUtterance === 'undefined') return 'unsupported';
  const voices = await loadVoices();
  const prefix = lang.slice(0, 2);
  const voice = voices.find((v) => v.lang === lang) ?? voices.find((v) => v.lang.toLowerCase().startsWith(prefix));
  if (!voice) return 'novoice';
  s.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang;
  u.voice = voice;
  u.rate = lang === 'zh-CN' ? 0.95 : 1;
  u.onend = onEnd;
  u.onerror = onEnd;
  s.speak(u);
  return 'ok';
}

export function stopSpeaking() {
  synth()?.cancel();
}

// ---------- speech recognition (voice input for the translator) ----------
// Chrome / Android send audio to Google (not available in mainland China, needs internet);
// Safari on iPhone uses Apple. Where it is missing, the translator falls back to typing and the phrasebook.
type Rec = { lang: string; interimResults: boolean; maxAlternatives: number; start: () => void; stop: () => void; onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null; onerror: ((e: { error: string }) => void) | null; onend: (() => void) | null };
const RecCtor = () => (typeof window === 'undefined' ? null : ((window as unknown as { SpeechRecognition?: new () => Rec; webkitSpeechRecognition?: new () => Rec }).SpeechRecognition ?? (window as unknown as { webkitSpeechRecognition?: new () => Rec }).webkitSpeechRecognition ?? null));
export const canListen = () => !!RecCtor();

/** Listens once; returns a stop function. onText gets the final transcript, onEnd is always called. */
export function listen(lang: 'zh-CN' | 'ru-RU', onText: (text: string) => void, onEnd: (error?: string) => void): () => void {
  const C = RecCtor();
  if (!C) {
    onEnd('unsupported');
    return () => {};
  }
  const r = new C();
  r.lang = lang;
  r.interimResults = false;
  r.maxAlternatives = 1;
  let err: string | undefined;
  r.onresult = (e) => {
    const text = Array.from(e.results).map((x) => x[0]?.transcript ?? '').join(' ').trim();
    if (text) onText(text);
  };
  r.onerror = (e) => (err = e.error);
  r.onend = () => onEnd(err);
  try {
    r.start();
  } catch {
    onEnd('failed');
  }
  return () => r.stop();
}
