import { createFileRoute } from '@tanstack/react-router'
import { EventCard } from '#/components/event_node'
import { useState, useEffect, useRef } from 'react'
import { SendHorizontal, Sparkles, AlertCircle, Globe } from 'lucide-react'
import { useAnalysis } from '#/hooks/useAnalysis'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  const [input, setInput] = useState('')
  const { nodes, sources, status, error, loading, streaming, analyze } =
    useAnalysis()
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (loading) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [nodes, status, sources, loading])

  const handleSubmit = async () => {
    const query = input.trim()
    if (!query || loading) return
    setInput('')
    await analyze(query)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSubmit()
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-500/30">
      <main className="flex-1 w-full max-w-2xl mx-auto px-4 pt-10 pb-36 overflow-y-auto space-y-8 scrollbar-thin">
        {sources.length > 0 && (
          <div className="space-y-2 max-w-md mx-auto animate-in fade-in duration-300">
            <h2 className="text-[11px] text-slate-500 font-medium tracking-widest uppercase px-1">
              Sources scraped
            </h2>
            {sources.map((source) => (
              <div
                key={source.url}
                className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-900/50 border border-slate-800/60 animate-in slide-in-from-bottom-2 duration-300"
              >
                <Globe className="w-3.5 h-3.5 text-slate-500 mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-slate-300 font-medium truncate">
                    {source.title || new URL(source.url).hostname}
                  </p>
                  <p className="text-[11px] text-slate-600 truncate">
                    {source.url}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {nodes.length > 0 ? (
          <div className="space-y-8 animate-in fade-in-50 duration-500">
            {nodes.map((node, i) => (
              <div
                key={node.id}
                className="transition-all duration-300 animate-in slide-in-from-bottom-4"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <EventCard
                  data={{
                    ...node,
                    isFirst: i === 0,
                    isLast: i === nodes.length - 1,
                  }}
                />
              </div>
            ))}

            {streaming && (
              <div className="flex items-center gap-3 max-w-md mx-auto px-1">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" />
                </div>
                <p className="text-xs text-slate-500 font-medium">
                  Analyzing sources, more results incoming...
                </p>
              </div>
            )}
          </div>
        ) : !loading && !error ? (
          <div className="h-[50vh] flex flex-col items-center justify-center text-center px-4 animate-in fade-in duration-700">
            <div className="p-4 rounded-full bg-slate-900 border border-slate-800/80 mb-4 shadow-xl shadow-blue-500/[0.02]">
              <Sparkles className="w-8 h-8 text-blue-400 opacity-80" />
            </div>
            <h1 className="text-xl font-semibold text-slate-200 tracking-tight mb-2">
              Corporate Investigation Engine
            </h1>
            <p className="text-sm text-slate-500 max-w-sm leading-relaxed">
              Enter an event, market shift, or business failure to trace its
              structural root causes.
            </p>
          </div>
        ) : null}

        {status && (
          <div className="flex items-center justify-center gap-3 p-4 rounded-xl bg-slate-900/40 border border-slate-900 text-slate-400 text-xs font-medium tracking-wide animate-pulse max-w-md mx-auto">
            <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)] animate-ping" />
            {status}
          </div>
        )}

        {error && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-red-950/20 border border-red-900/50 text-red-400 text-sm max-w-md mx-auto animate-in shake-1">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <p className="font-medium">{error}</p>
          </div>
        )}

        <div ref={bottomRef} />
      </main>

      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-slate-950 via-slate-950/90 to-transparent pt-16 pb-8 px-4 pointer-events-none">
        <div className="max-w-xl mx-auto w-full pointer-events-auto">
          <div className="flex items-center gap-2 bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-2xl p-1.5 pr-2 shadow-2xl transition-all duration-300 focus-within:border-blue-500/50 focus-within:ring-4 focus-within:ring-blue-500/[0.04]">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              placeholder="e.g., How did Nvidia become so valuable?"
              className="bg-transparent text-slate-100 placeholder-slate-500 text-sm px-3 py-2.5 w-full focus:outline-none disabled:opacity-50 font-medium tracking-wide"
            />
            <button
              onClick={handleSubmit}
              disabled={loading || !input.trim()}
              className="inline-flex items-center justify-center text-white h-9 w-9 bg-blue-600 hover:bg-blue-500 active:scale-95 transition-all rounded-xl disabled:opacity-30 disabled:pointer-events-none disabled:transform-none shadow-lg shadow-blue-600/20"
            >
              <SendHorizontal className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[11px] text-center text-slate-600 mt-3 font-medium tracking-wide">
            Powered by Architectural Network Analysis Model
          </p>
        </div>
      </div>
    </div>
  )
}
