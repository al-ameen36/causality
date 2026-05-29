import { createFileRoute } from '@tanstack/react-router'
import { EventCard } from '#/components/event_node'
import { useState } from 'react'
import { SendHorizonal } from 'lucide-react'
import type { EventNode } from '#/types/nodes'

type AnalyzeResponse = {
  event: string
  sources: { url: string; title: string }[]
  tree: EventNode
}

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  const [tree, setTree] = useState<EventNode | null>(null)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    const event = input.trim()
    if (!event || loading) return

    setLoading(true)
    setError(null)
    setTree(null)

    try {
      const res = await fetch('http://localhost:3001/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(
          body.error ?? `Request failed with status ${res.status}`,
        )
      }

      const data: AnalyzeResponse = await res.json()
      setTree(data.tree)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSubmit()
  }

  const nodes = tree ? [tree, ...(tree.children ?? [])] : []

  return (
    <div>
      <div className="w-screen py-10 flex justify-center h-[calc(100vh-140px)] overflow-auto gap-[18px]">
        <div className="grid gap-10">
          {loading && (
            <p className="text-gray-400 text-center animate-pulse">
              Researching... this may take a minute
            </p>
          )}

          {error && <p className="text-red-400 text-center">{error}</p>}

          {nodes.length > 0
            ? nodes.map((node, i) => (
                <EventCard
                  key={node.id}
                  data={{
                    ...node,
                    isFirst: i === 0,
                    isLast: i === nodes.length - 1,
                  }}
                />
              ))
            : !loading &&
              !error && (
                <p className="text-gray-500 text-center">
                  Ask a question to get started
                </p>
              )}
        </div>
      </div>

      <div className="flex justify-center bg-[#121212] py-10 w-full fixed left-1/2 -translate-x-1/2 bottom-0">
        <div className="w-[min(100%,500px)] border-gray-900 bg-gray-300 text-black h-[50px] border border-gray-200 flex justify-center rounded-[10px]">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            placeholder="How did Nvidia become so valuable?"
            className="p-2 rounded-[10px_0px_0px_10px] w-full max-w-full disabled:opacity-50"
          />
          <button
            onClick={handleSubmit}
            disabled={loading || !input.trim()}
            className="text-gray-300 h-full w-[50px] bg-blue-500 px-2 flex justify-center items-center rounded-[0px_10px_10px_0px] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <SendHorizonal />
          </button>
        </div>
      </div>
    </div>
  )
}
