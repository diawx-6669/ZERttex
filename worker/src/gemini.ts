// Google Gemini (Generative Language API) for the four endpoints. Plain fetch, no SDK,
// so the same code runs in the Worker and in the browser demo mode.
// Same system prompt and JSON schemas as the Claude path (prompts.ts).

import { COMMON, ENDPOINTS, isStandalone, type EndpointName } from './prompts';

/** Tried in order: a busy or failing model falls through to the next one. */
export const GEMINI_MODELS = ['gemini-3.5-flash', 'gemini-3.8-flash', 'gemini-3.5-flash-lite'] as const;
const API = 'https://generativelanguage.googleapis.com/v1beta/models';

export class GeminiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function callGemini(
  apiKey: string,
  name: EndpointName,
  input: Record<string, unknown>,
  opts: { signal?: AbortSignal; fetchImpl?: typeof fetch; baseUrl?: string } = {},
): Promise<{ data: unknown; model: string }> {
  const doFetch = opts.fetchImpl ?? fetch;
  const ep = ENDPOINTS[name];
  const body = JSON.stringify({
    systemInstruction: { parts: [{ text: isStandalone(name) ? ep.task : `${COMMON}\n\n${ep.task}` }] },
    contents: [{ role: 'user', parts: [{ text: JSON.stringify(input) }] }],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 900,
      responseMimeType: 'application/json',
      responseJsonSchema: ep.schema,
      thinkingConfig: { thinkingLevel: 'minimal' },
    },
  });
  let last: GeminiError = new GeminiError(0, 'no model tried');
  for (const model of GEMINI_MODELS) {
    const res = await doFetch(`${opts.baseUrl ?? API}/${model}:generateContent`, {
      method: 'POST',
      // Key in a header, not in the URL, so it never lands in access logs.
      headers: { 'content-type': 'application/json', 'x-goog-api-key': apiKey },
      body,
      signal: opts.signal,
    });
    if (res.ok) {
      const j = (await res.json()) as { candidates?: { finishReason?: string; content?: { parts?: { text?: string }[] } }[] };
      const c = j.candidates?.[0];
      const text = c?.content?.parts?.map((p) => p.text ?? '').join('') ?? '';
      if (c?.finishReason && c.finishReason !== 'STOP') throw new GeminiError(502, `finishReason ${c.finishReason}`);
      return { data: JSON.parse(text), model };
    }
    last = new GeminiError(res.status, await res.text().catch(() => ''));
    // Busy (429/503) or model not available (404): try the next model. Anything else: stop.
    if (![404, 429, 500, 503].includes(res.status)) throw last;
  }
  throw last;
}
