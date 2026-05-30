import OpenAI from 'openai'
import { z } from 'zod'

const MAX_CHARS_PER_DOC = Number(process.env.MAX_CHARS_PER_DOC) || 50000
const MAX_CONCURRENT = Number(process.env.MAX_CONCURRENT) || 1

export const CauseNode = z.object({
  id: z.string(),
  label: z.string(),
  description: z.string(),
  sources: z.array(z.object({ url: z.string(), title: z.string() })),
})

export type CauseNode = z.infer<typeof CauseNode>

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
- Keep every description under 100 words
- Cite sources from the provided context only
- Order causes from most to least impactful

Output one JSON object per line (NDJSON). Each line must be a complete, valid JSON object for a single cause.
No wrapper object, no array brackets, no markdown, no explanation — just one cause per line, like this:

{"id":"unique-kebab-case-id","label":"Short cause title","description":"Concise explanation under 40 words.","sources":[{"url":"string","title":"string"}]}
{"id":"unique-kebab-case-id","label":"Short cause title","description":"Concise explanation under 40 words.","sources":[{"url":"string","title":"string"}]}`

// -- Queue --
let active = 0
const queue: {
  fn: () => Promise<void>
  resolve: () => void
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

function enqueue(fn: () => Promise<void>): Promise<void> {
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

function createClient() {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_API_BASE_URL,
  })
}

async function _runLLM(
  mainEvent: string,
  docs: Doc[],
  onNode: (node: CauseNode) => void,
): Promise<void> {
  const client = createClient()
  const context = buildContext(docs)

  const stream = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL!,
    max_tokens: 32000,
    stream: true,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Main event: ${mainEvent}\n\nResearch context:\n${context}`,
      },
    ],
  })

  let buffer = ''

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content ?? ''
    buffer += delta

    // Extract and emit every complete line
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? '' // last element may be incomplete — keep it

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed) continue
      try {
        const parsed = CauseNode.parse(JSON.parse(trimmed))
        onNode(parsed)
      } catch {
        console.warn('[LLM] Could not parse line:', trimmed.slice(0, 100))
      }
    }
  }

  // Flush any remaining content in the buffer
  const remaining = buffer.trim()
  if (remaining) {
    try {
      const parsed = CauseNode.parse(JSON.parse(remaining))
      onNode(parsed)
    } catch {
      console.warn(
        '[LLM] Could not parse final buffer:',
        remaining.slice(0, 100),
      )
    }
  }
}

export function runLLM(
  mainEvent: string,
  docs: Doc[],
  onNode: (node: CauseNode) => void,
): Promise<void> {
  return enqueue(() => _runLLM(mainEvent, docs, onNode))
}
