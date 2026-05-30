import { createFileRoute } from '@tanstack/react-router'
import { search } from '#/server/serp'
import { extractOrganicUrls } from '#/server/extract'
import { createBrowser, fetchArticle } from '#/server/fetch'
import { runLLM } from '#/server/llm'

const MAX_CHARS_PER_DOC = 50000
const MAX_CHARS_PER_BATCH = 400000
const MAX_SITES_TO_SCRAPE = 10

function dedupeByUrl(
  items: { url: string; title: string; snippet: string; source: string }[],
) {
  const seen = new Set<string>()
  return items.filter((item) => {
    if (seen.has(item.url)) return false
    seen.add(item.url)
    return true
  })
}

export const Route = createFileRoute('/api/analyze')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await request.json().catch(() => ({}))
        const { event } = body

        if (!event || typeof event !== 'string' || !event.trim()) {
          return new Response(JSON.stringify({ error: 'event is required' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          })
        }

        const mainEvent = event.trim()
        const queries = [
          mainEvent,
          `${mainEvent} history`,
          `${mainEvent} reasons causes`,
        ]
        const encoder = new TextEncoder()

        const stream = new ReadableStream({
          async start(controller) {
            function send(eventName: string, data: unknown) {
              const payload = `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`
              controller.enqueue(encoder.encode(payload))
            }

            const browser = await createBrowser()

            try {
              send('status', { message: 'Searching the web...' })

              const discovered: {
                url: string
                title: string
                snippet: string
                source: string
              }[] = []
              for (const query of queries) {
                const serpData = await search(query)
                const urls = extractOrganicUrls(serpData)
                discovered.push(...urls)
              }

              const unique = dedupeByUrl(discovered).slice(
                0,
                MAX_SITES_TO_SCRAPE,
              )
              send('status', {
                message: `Found ${unique.length} sources. Scraping...`,
              })

              const llmPromises: Promise<void>[] = []
              let currentBatch: typeof discovered = []
              let currentBatchSize = 0
              let batchIndex = 0

              function fireBatch(batch: typeof discovered, index: number) {
                send('status', { message: `Analyzing batch ${index + 1}...` })
                const promise = runLLM(mainEvent, batch)
                  .then((result) => {
                    for (const cause of result.causes) send('node', cause)
                  })
                  .catch(() => {
                    send('status', {
                      message: `Could not analyze batch ${index + 1}`,
                    })
                  })
                llmPromises.push(promise)
              }

              for (const item of unique) {
                const doc = await fetchArticle(browser, item.url)
                if (!doc || !doc.text || doc.text.length < 500) continue

                const fullDoc = {
                  url: doc.url,
                  title: doc.title || item.title || '',
                  text: doc.text,
                  source: item.source,
                  snippet: item.snippet,
                }

                const docSize = Math.min(fullDoc.text.length, MAX_CHARS_PER_DOC)

                if (
                  currentBatch.length > 0 &&
                  currentBatchSize + docSize > MAX_CHARS_PER_BATCH
                ) {
                  fireBatch(currentBatch, batchIndex++)
                  currentBatch = []
                  currentBatchSize = 0
                }

                currentBatch.push(fullDoc)
                currentBatchSize += docSize
                send('source', { url: fullDoc.url, title: fullDoc.title })
              }

              if (currentBatch.length > 0) fireBatch(currentBatch, batchIndex)

              if (llmPromises.length === 0) {
                send('error', {
                  message: 'No usable documents found for this event',
                })
              } else {
                await Promise.allSettled(llmPromises)
              }

              send('done', { message: 'Analysis complete' })
            } catch (err) {
              send('error', {
                message: err instanceof Error ? err.message : 'Unknown error',
              })
            } finally {
              await browser.close()
              controller.close()
            }
          },
        })

        return new Response(stream, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
          },
        })
      },
    },
  },
})
