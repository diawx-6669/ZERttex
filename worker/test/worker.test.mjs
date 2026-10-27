// Runs the real Worker locally (wrangler dev) against a MOCK Messages API.
// No API key and no network to Anthropic needed.   cd worker && npm test
import { spawn } from 'node:child_process';
import http from 'node:http';

const MOCK_PORT = 8790;
const WORKER_PORT = 8791;
const ORIGIN = 'https://diawx-6669.github.io';
let nextReply = null; // what the mock Messages API returns next
const seen = [];

const mock = http.createServer((req, res) => {
  let body = '';
  req.on('data', (c) => (body += c));
  req.on('end', () => {
    seen.push({ url: req.url, headers: req.headers, body: JSON.parse(body || '{}') });
    const text = typeof nextReply === 'string' ? nextReply : JSON.stringify(nextReply);
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ id: 'msg_mock', type: 'message', role: 'assistant', model: 'claude-haiku-5-5', content: [{ type: 'text', text }], stop_reason: 'end_turn', usage: { input_tokens: 10, output_tokens: 10 } }));
  });
});
await new Promise((r) => mock.listen(MOCK_PORT, '127.0.0.1', r));

const wr = spawn('npx', ['wrangler', 'dev', '--port', String(WORKER_PORT), '--ip', '127.0.0.1', '--var', `ANTHROPIC_BASE_URL:http://127.0.0.1:${MOCK_PORT}`, '--var', 'ANTHROPIC_API_KEY:test-key-not-real'], {
  env: { ...process.env, WRANGLER_SEND_METRICS: 'false', CI: '1' },
  stdio: ['ignore', 'pipe', 'pipe'],
});
let log = '';
wr.stdout.on('data', (d) => (log += d));
wr.stderr.on('data', (d) => (log += d));
const base = `http://127.0.0.1:${WORKER_PORT}`;
for (let i = 0; i < 120; i++) {
  try { if ((await fetch(base + '/health')).ok) break; } catch {}
  await new Promise((r) => setTimeout(r, 500));
}

const results = [];
const ok = (name, cond, info = '') => { results.push(!!cond); console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${info ? '  — ' + info : ''}`); };
const post = (path, body, origin = ORIGIN, extra = {}) =>
  fetch(base + path, { method: 'POST', headers: { 'content-type': 'application/json', ...(origin ? { origin } : {}), ...extra }, body: typeof body === 'string' ? body : JSON.stringify(body) });

try {
  const h = await fetch(base + '/health');
  ok('GET /health', h.ok && (await h.json()).model === 'claude-haiku-5-5');

  const pre = await fetch(base + '/chat', { method: 'OPTIONS', headers: { origin: ORIGIN, 'access-control-request-method': 'POST' } });
  ok('CORS preflight from GitHub Pages', pre.status === 204 && pre.headers.get('access-control-allow-origin') === ORIGIN);
  const preBad = await fetch(base + '/chat', { method: 'OPTIONS', headers: { origin: 'https://evil.example' } });
  ok('CORS preflight from other origin refused', preBad.status === 403);
  ok('POST without allowed origin refused', (await post('/chat', { question: 'hi' }, 'https://evil.example')).status === 403);

  nextReply = { answer: 'Kolsai: included are guide and transport. Park fees are not yet confirmed.', labels: ['Demo data', 'Made up label'], actions: ['/tour/kolsai', 'handoff', 'https://evil.example'] };
  const r1 = await post('/chat', { question: "What's included in Kolsai?", lang: 'en', tourId: 'kolsai' });
  const j1 = await r1.json();
  ok('/chat returns cleaned JSON', r1.status === 200 && j1.answer.startsWith('Kolsai') && j1.ai === true, JSON.stringify(j1));
  ok('/chat drops unknown labels and routes', JSON.stringify(j1.labels) === '["Demo data"]' && JSON.stringify(j1.actions) === '["/tour/kolsai","handoff"]');
  const sent = seen.at(-1).body;
  ok('Request: model claude-haiku-5-5, max_tokens 600', sent.model === 'claude-haiku-5-5' && sent.max_tokens === 600);
  ok('Request: grounding in a cached system block + JSON schema output', sent.system[0].cache_control?.type === 'ephemeral' && sent.system[0].text.includes('notYetConfirmed') && sent.output_config?.format?.type === 'json_schema');
  ok('Request: no temperature, thinking disabled, effort low', !('temperature' in sent) && sent.thinking?.type === 'disabled' && sent.output_config.effort === 'low');
  const hd = seen.at(-1).headers;
  ok('API key sent only server-side', (hd['x-api-key'] === 'test-key-not-real' || hd.authorization === 'Bearer test-key-not-real') && !JSON.stringify(j1).includes('test-key'));
  ok('CORS header on response', r1.headers.get('access-control-allow-origin') === ORIGIN);

  nextReply = 'this is { not json';
  ok('Invalid model JSON → 502 (frontend falls back)', (await post('/chat', { question: 'hi', lang: 'en' })).status === 502);
  nextReply = { answer: '', labels: [], actions: [] };
  ok('Empty answer → 502', (await post('/chat', { question: 'hi', lang: 'en' })).status === 502);

  nextReply = { destinations: ['kolsai', 'burabay', 'mars'], days: 8, travelers: 2, interests: ['nature', 'shopping'], budget: 'comfort', note: 'Two lakes trips, 8 days.' };
  const p = await (await post('/plan', { text: '8 days, lakes and mountains, 2 people, comfortable', lang: 'en' })).json();
  ok('/plan returns preferences only (cleaned)', JSON.stringify(p.destinations) === '["kolsai","burabay"]' && p.days === 8 && p.travelers === 2 && JSON.stringify(p.interests) === '["nature"]' && p.budget === 'comfort' && !('itinerary' in p));

  nextReply = { zh: ['查伦峡谷的红色岩壁 #哈萨克斯坦', '官方最好的线路', '日落时分的峡谷'], en: ['Red canyon walls at sunset #Kazakhstan', 'The best tour ever', 'Steppe stars'] };
  const c = await (await post('/caption', { tourId: 'charyn', message: 'Wow' })).json();
  ok('/caption filters brand-claim captions', c.zh.length === 2 && c.en.length === 2 && !c.zh.join().includes('官方') && !c.en.join().includes('best'));
  ok('/caption rejects unknown tour', (await post('/caption', { tourId: 'mars' })).status === 400);

  nextReply = { summary_ru: 'Турист спрашивает о свободных местах на Kolsai 3 мая.', reply: 'Hello! [confirm availability for 3 May]', check_ru: ['Проверить места'], labels: ['Demo data'] };
  const m = await (await post('/manager', { question: 'Is Kolsai available on 3 May?', travelerLang: 'en', tourId: 'kolsai' })).json();
  ok('/manager returns RU summary + draft', m.summary_ru.startsWith('Турист') && m.reply.includes('[confirm') && m.check_ru.length === 1);

  ok('Body > 8 KB refused', (await post('/chat', { question: 'x'.repeat(9000) })).status === 413);
  ok('Bad JSON body refused', (await post('/chat', '{oops')).status === 400);
  ok('Unknown endpoint 404', (await post('/admin', {})).status === 404);

  nextReply = { answer: 'ok', labels: [], actions: [] };
  let last = 0;
  for (let i = 0; i < 25; i++) last = (await post('/chat', { question: 'rate test ' + i, lang: 'en' }, ORIGIN, { 'cf-connecting-ip': '203.0.113.9' })).status;
  ok('Rate limit: 20 requests / IP / 10 min → 429', last === 429);
} finally {
  wr.kill('SIGTERM');
  mock.close();
}
const failed = results.filter((x) => !x).length;
console.log(`\n${results.length - failed}/${results.length} worker checks passed`);
if (failed) { console.log(log.slice(-3000)); process.exit(1); }
process.exit(0);
