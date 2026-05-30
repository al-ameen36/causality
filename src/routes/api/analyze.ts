import { createFileRoute } from '@tanstack/react-router'
import { search } from '#/server/serp'
import { extractOrganicUrls } from '#/server/extract'
import { runLLM } from '#/server/llm'
import type { Doc } from '#/server/llm'
import type { OrganicUrl } from '#/server/extract'

const MAX_SITES_TO_USE = Number(process.env.MAX_SITES_TO_SCRAPE) || 10
const MAX_CHARS_PER_BATCH = Number(process.env.MAX_CHARS_PER_BATCH) || 20000

function dedupeByUrl(items: OrganicUrl[]) {
  const seen = new Set<string>()
  return items.filter((i) => {
    if (seen.has(i.url)) return false
    seen.add(i.url)
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
          `${mainEvent} causes`,
          `${mainEvent} history`,
        ]

        const encoder = new TextEncoder()

        const stream = new ReadableStream({
          async start(controller) {
            const send = (event: string, data: unknown) => {
              controller.enqueue(
                encoder.encode(
                  `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`,
                ),
              )
            }

            try {
              send('status', { message: 'Searching the web...' })

              const allResults: OrganicUrl[] = []

              for (const q of queries) {
                const serp = await search(q)
                const urls = extractOrganicUrls(serp)
                allResults.push(...urls)
              }

              const unique = dedupeByUrl(allResults).slice(0, MAX_SITES_TO_USE)

              if (unique.length === 0) {
                send('error', { message: 'No search results found' })
                send('done', { message: 'Finished' })
                return
              }

              send('status', {
                message: `Analyzing ${unique.length} sources...`,
              })

              const docs: Doc[] = unique.map((u) => ({
                url: u.url,
                title: u.title || u.url,
                text: u.snippet || u.title || '',
                source: u.source,
                snippet: u.snippet,
              }))

              const batchPromises: Promise<void>[] = []
              let batch: Doc[] = []
              let batchSize = 0
              let batchIndex = 0

              const flushBatch = (items: Doc[]) => {
                if (!items.length) return

                const currentIndex = batchIndex
                batchIndex += 1

                send('status', {
                  message: `Analyzing batch ${currentIndex + 1}...`,
                })

                const p = runLLM(mainEvent, items, (node) => {
                  send('node', node)
                }).catch((err) => {
                  send('error', {
                    message:
                      err instanceof Error
                        ? `Batch ${currentIndex + 1} failed: ${err.message}`
                        : `Batch ${currentIndex + 1} failed`,
                  })
                })

                batchPromises.push(p)
              }

              for (const doc of docs) {
                send('source', { url: doc.url, title: doc.title })

                const size = doc.text.length

                if (
                  batch.length > 0 &&
                  batchSize + size > MAX_CHARS_PER_BATCH
                ) {
                  flushBatch(batch)
                  batch = []
                  batchSize = 0
                }

                batch.push(doc)
                batchSize += size
              }

              if (batch.length > 0) {
                flushBatch(batch)
              }

              if (batchPromises.length === 0) {
                send('error', {
                  message: 'No usable documents found for this event',
                })
              } else {
                await Promise.allSettled(batchPromises)
              }

              send('done', { message: 'Analysis complete' })
            } catch (err) {
              send('error', {
                message: err instanceof Error ? err.message : 'Unknown error',
              })
              send('done', { message: 'Finished with errors' })
            } finally {
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
