import { useState, useRef } from 'react'
import type { EventNode } from '#/types/nodes'

type ScrapedSource = { url: string; title: string }

type AnalysisState = {
  nodes: EventNode[]
  sources: ScrapedSource[]
  status: string | null
  error: string | null
  loading: boolean
  streaming: boolean
}

export function useAnalysis() {
  const [state, setState] = useState<AnalysisState>({
    nodes: [],
    sources: [],
    status: null,
    error: null,
    loading: false,
    streaming: false,
  })

  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null)

  function patch(partial: Partial<AnalysisState>) {
    setState((prev) => ({ ...prev, ...partial }))
  }

  async function analyze(query: string) {
    if (!query.trim() || state.loading) return

    patch({
      loading: true,
      streaming: false,
      error: null,
      status: 'Initializing root-cause analysis...',
      nodes: [],
      sources: [],
    })

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: query }),
      })

      if (!res.ok || !res.body) {
        const body = await res.json().catch(() => ({}))
        throw new Error(
          body.error ?? `Request failed with status ${res.status}`,
        )
      }

      const reader = res.body.getReader()
      readerRef.current = reader
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const parts = buffer.split('\n\n')
        buffer = parts.pop() ?? ''

        for (const part of parts) {
          const eventName = part.match(/^event: (\w+)/m)?.[1]
          const dataRaw = part.match(/^data: (.+)/m)?.[1]
          if (!eventName || !dataRaw) continue

          const data = JSON.parse(dataRaw)

          if (eventName === 'status') patch({ status: data.message })
          if (eventName === 'source')
            setState((prev) => ({ ...prev, sources: [...prev.sources, data] }))
          if (eventName === 'error') patch({ error: data.message })
          if (eventName === 'node')
            setState((prev) => ({
              ...prev,
              nodes: [...prev.nodes, data],
              status: null,
              streaming: true,
            }))
          if (eventName === 'done')
            patch({ status: null, streaming: false, loading: false })
        }
      }
    } catch (err) {
      patch({
        error: err instanceof Error ? err.message : 'Something went wrong',
      })
    } finally {
      patch({ loading: false })
      readerRef.current = null
    }
  }

  function cancel() {
    readerRef.current?.cancel()
    readerRef.current = null
    patch({ loading: false, streaming: false, status: null })
  }

  return { ...state, analyze, cancel }
}
