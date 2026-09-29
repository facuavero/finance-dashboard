// proveedores de ia con tier gratuito. se habla por http directo, sin sdk.

export type Engine = { id: 'gemini' | 'groq'; model: string; label: string }

export function availableEngine(): Engine | null {
  if (process.env.GEMINI_API_KEY) return { id: 'gemini', model: process.env.GEMINI_MODEL || 'gemini-2.5-flash', label: 'Gemini' }
  if (process.env.GROQ_API_KEY) return { id: 'groq', model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile', label: 'Groq' }
  return null
}

type Msg = { system: string; user: string; json: boolean; maxTokens?: number }

async function withTimeout<T>(p: (signal: AbortSignal) => Promise<T>, ms: number): Promise<T> {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), ms)
  try {
    return await p(ctrl.signal)
  } finally {
    clearTimeout(t)
  }
}

async function gemini(e: Engine, m: Msg): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(e.model)}:generateContent`
  const res = await withTimeout(
    (signal) =>
      fetch(url, {
        method: 'POST',
        signal,
        headers: { 'content-type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY! },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: m.system }] },
          contents: [{ role: 'user', parts: [{ text: m.user }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: m.maxTokens ?? 4096, ...(m.json ? { responseMimeType: 'application/json' } : {}) },
        }),
      }),
    30_000,
  )
  if (!res.ok) throw new Error(`gemini ${res.status}: ${(await res.text()).slice(0, 200)}`)
  const data = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] }
  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? ''
  if (!text) throw new Error('gemini: respuesta vacía')
  return text
}

async function groq(e: Engine, m: Msg): Promise<string> {
  const res = await withTimeout(
    (signal) =>
      fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        signal,
        headers: { 'content-type': 'application/json', authorization: `Bearer ${process.env.GROQ_API_KEY}` },
        body: JSON.stringify({
          model: e.model,
          temperature: 0.3,
          max_tokens: m.maxTokens ?? 4096,
          messages: [
            { role: 'system', content: m.system },
            { role: 'user', content: m.user },
          ],
          ...(m.json ? { response_format: { type: 'json_object' } } : {}),
        }),
      }),
    30_000,
  )
  if (!res.ok) throw new Error(`groq ${res.status}: ${(await res.text()).slice(0, 200)}`)
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] }
  const text = data.choices?.[0]?.message?.content ?? ''
  if (!text) throw new Error('groq: respuesta vacía')
  return text
}

export async function complete(e: Engine, m: Msg): Promise<string> {
  return e.id === 'gemini' ? gemini(e, m) : groq(e, m)
}

export function parseJson<T>(text: string): T {
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '')
  return JSON.parse(cleaned) as T
}
