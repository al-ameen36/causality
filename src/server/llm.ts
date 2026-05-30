import OpenAI from 'openai'
import { z } from 'zod'

const CauseNode = z.object({
  id: z.string(),
  label: z.string(),
  description: z.string(),
  sources: z.array(z.object({ url: z.string(), title: z.string() })),
})

const AnalysisResultSchema = z.object({
  causes: z.array(CauseNode),
})

export type CauseNode = z.infer<typeof CauseNode>
export type AnalysisResult = z.infer<typeof AnalysisResultSchema>

export type Doc = {
  url: string
  title: string
  text: string
  source?: string
  snippet?: string
}

const SYSTEM_PROMPT = `You are an expert analyst that identifies the key events, factors, and causes that led to a given main event.

When given a main event, identify between 5 and 8 SPECIFIC, DISTINCT causes. Each cause must be a concrete factor on its own — not a summary or overview of all causes combined.

BAD example (do not do this):
- "Apple's success resulted from leadership, products, and branding" ← this is a summary, not a cause

GOOD examples:
- "Steve Jobs' return in 1997 and product vision"
- "Launch of the iPhone in 2007"
- "The App Store ecosystem lock-in"

Rules:
- Each cause must be independent and specific
- Keep every description under 40 words
- Cite sources from the provided context only
- Order causes from most to least impactful
- Respond with raw JSON only — no markdown, no code fences, no explanation

You MUST respond with only a valid JSON object matching this exact structure:
{
  "causes": [
    {
      "id": "unique-kebab-case-id",
      "label": "Short cause title",
      "description": "Concise explanation under 40 words.",
      "sources": [{ "url": "string", "title": "string" }]
    }
  ]
}`

const MAX_CHARS_PER_DOC = 50000
const MAX_CONCURRENT = 1

// -- Queue --
let active = 0
const queue: {
  fn: () => Promise<AnalysisResult>
  resolve: (v: AnalysisResult) => void
  reject: (e: unknown) => void
}[] = []

function dequeue() {
  if (active >= MAX_CONCURRENT || queue.length === 0) return
  active++
  const { fn, resolve, reject } = queue.shift()!

  Promise.resolve()
    .then(() => fn())
    .then(resolve)
    .catch(reject)
    .finally(() => {
      active--
      console.log(`[QUEUE] Done. ${active} active, ${queue.length} waiting`)
      dequeue()
    })
}

function enqueue(fn: () => Promise<AnalysisResult>): Promise<AnalysisResult> {
  return new Promise((resolve, reject) => {
    queue.push({ fn, resolve, reject })
    console.log(`[QUEUE] ${queue.length} waiting, ${active} active`)
    dequeue()
  })
}
// -- End Queue --

function buildContext(docs: Doc[]): string {
  return docs
    .map((doc, i) => {
      const text = doc.text.slice(0, MAX_CHARS_PER_DOC)
      const truncated = doc.text.length > MAX_CHARS_PER_DOC
      return `
--- SOURCE ${i + 1} ---
Title: ${doc.title}
URL: ${doc.url}
${text}${truncated ? '\n[truncated]' : ''}
`.trim()
    })
    .join('\n\n')
}

function sanitizeResult(result: AnalysisResult): AnalysisResult {
  return {
    causes: Array.isArray(result.causes)
      ? result.causes.map((c) => ({
          ...c,
          sources: Array.isArray(c.sources) ? c.sources : [],
        }))
      : [],
  }
}

function createClient() {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_API_BASE_URL,
  })
}

function attemptRecovery(text: string): unknown | null {
  const lastComplete = text.lastIndexOf('},\n    {')
  if (lastComplete === -1) return null
  try {
    const recovered = text.slice(0, lastComplete + 1) + '\n  ]\n}'
    return JSON.parse(recovered)
  } catch {
    return null
  }
}

async function _runLLM(
  mainEvent: string,
  docs: Doc[],
): Promise<AnalysisResult> {
  const client = createClient()
  const context = buildContext(docs)

  const response = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL!,
    max_tokens: 32000,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Main event: ${mainEvent}\n\nResearch context:\n${context}`,
      },
    ],
  })

  const message = response.choices[0]?.message
  const finishReason = response.choices[0]?.finish_reason
  const raw =
    message?.content ||
    (message as unknown as { reasoning?: string })?.reasoning

  if (!raw) {
    console.error('[LLM] Full response:', JSON.stringify(response, null, 2))
    throw new Error(`LLM returned no content. finish_reason: ${finishReason}`)
  }

  if (finishReason === 'length') {
    console.warn('[LLM] Response cut off, attempting partial recovery...')
    const lastValidClose = raw.lastIndexOf('},\n    {')
    if (lastValidClose !== -1) {
      const recovered = raw.slice(0, lastValidClose) + '}]\n}'
      try {
        const parsed = JSON.parse(recovered)
        const validated = AnalysisResultSchema.parse(parsed)
        return sanitizeResult(validated)
      } catch (err) {
        console.error('[LLM] Parse/validation error:', (err as Error).message)
        console.error('[LLM] Raw output:', raw.slice(0, 500))
        throw new Error(
          `Failed to parse LLM response: ${(err as Error).message}`,
        )
      }
    }
    throw new Error('LLM response cut off and recovery failed')
  }

  const cleaned = raw
    .replace(/^```(?:json)?\n?/i, '')
    .replace(/\n?```$/, '')
    .trim()

  try {
    let parsed: unknown
    try {
      parsed = JSON.parse(cleaned)
    } catch {
      console.warn('[LLM] JSON parse failed, attempting partial recovery...')
      parsed = attemptRecovery(cleaned)
      if (!parsed)
        throw new Error('Recovery failed — no complete cause objects found')
    }

    const validated = AnalysisResultSchema.parse(parsed)
    return sanitizeResult(validated)
  } catch (err) {
    console.error('[LLM] Parse/validation error:', (err as Error).message)
    console.error('[LLM] Raw output:', raw.slice(0, 500))
    throw new Error(`Failed to parse LLM response: ${(err as Error).message}`)
  }
}

// Public — automatically queued
export function runLLM(
  mainEvent: string,
  docs: Doc[],
): Promise<AnalysisResult> {
  return enqueue(() => _runLLM(mainEvent, docs))
}
