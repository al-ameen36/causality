import { createFileRoute } from '@tanstack/react-router'
import { search } from '#/server/serp'
import { extractOrganicUrls, scrapeUrlContent } from '#/server/extract'
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

              // 1. Run search queries in parallel
              const serpResults = await Promise.allSettled(
                queries.map((q) => search(q)),
              )

              for (const res of serpResults) {
                if (res.status === 'fulfilled') {
                  const urls = extractOrganicUrls(res.value)
                  allResults.push(...urls)
                } else {
                  console.error('[Analyze API] Search query failed:', res.reason)
                }
              }

              const unique = dedupeByUrl(allResults).slice(0, MAX_SITES_TO_USE)

              if (unique.length === 0) {
                send('error', { message: 'No search results found' })
                send('done', { message: 'Finished' })
                return
              }

              send('status', {
                message: `Found ${unique.length} sources. Scraping content...`,
              })

              // 2. Fetch full text content with limited concurrency (max 3 concurrent scrapes)
              const docs: Doc[] = new Array(unique.length)
              let index = 0
              const CONCURRENCY_LIMIT = 3

              async function worker() {
                while (index < unique.length) {
                  const i = index++
                  const u = unique[i]
                  send('status', { message: `Scraping: ${u.title || u.url}` })
                  try {
                    const fullText = await scrapeUrlContent(u.url)
                    docs[i] = {
                      url: u.url,
                      title: u.title || u.url,
                      text: fullText || u.snippet || u.title || '',
                      source: u.source,
                      snippet: u.snippet,
                    }
                  } catch (err) {
                    console.error(`[Analyze API] Error scraping ${u.url}:`, err)
                    docs[i] = {
                      url: u.url,
                      title: u.title || u.url,
                      text: u.snippet || u.title || '',
                      source: u.source,
                      snippet: u.snippet,
                    }
                  }
                  // Notify client about this source being loaded
                  send('source', { url: docs[i].url, title: docs[i].title })
                }
              }

              const workers = Array.from(
                { length: Math.min(CONCURRENCY_LIMIT, unique.length) },
                worker,
              )
              await Promise.all(workers)

              send('status', {
                message: `Analyzing batch content...`,
              })

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
