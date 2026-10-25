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

export async function speak(text: string, lang: 'zh-CN' | 'en-US', onEnd: () => void): Promise<SpeakResult> {
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
