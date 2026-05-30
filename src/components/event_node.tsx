import type { EventWithMetadata } from '#/types/nodes'
import { ArrowUpRight, Link2 } from 'lucide-react'

type Props = {
  data: EventWithMetadata
}

function getFavicon(url: string) {
  try {
    const domain = new URL(url).hostname
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`
  } catch {
    return null
  }
}

export function EventCard({ data }: Props) {
  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Main Parent Card */}
      <div
        className={
          'relative p-6 rounded-2xl border transition-all duration-200 shadow-sm bg-slate-800 border-slate-800 text-slate-100 shadow-slate-950/50'
        }
      >
        {/* Card Header / Label */}
        <h2
          className={'text-base font-semibold tracking-tight mb-2 text-white'}
        >
          {data.label}
        </h2>

        {/* Card Description */}
        <p className={'text-sm leading-relaxed mb-6 text-slate-400'}>
          {data.description}
        </p>

        {/* Sources Section */}
        {data.sources && data.sources.length > 0 && (
          <div className="flex flex-wrap gap-2 items-center pt-4 border-t border-dashed border-slate-800">
            <span className="text-xs font-medium text-slate-400 flex items-center gap-1 mr-1">
              <Link2 className="w-3 h-3" /> Sources:
            </span>
            {data.sources.map((source, idx) => {
              const favicon = getFavicon(source.url)
              return (
                <a
                  key={idx}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={source.title}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors bg-slate-600 hover:bg-slate-700 text-slate-100 border border-slate-700"
                >
                  {favicon && (
                    <img
                      src={favicon}
                      alt=""
                      className="w-3.5 h-3.5 rounded-sm object-contain"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  )}
                  <span className="truncate max-w-[100px]">
                    {source.title.split('—')[0].trim().slice(0, 20)}
                  </span>
                  <ArrowUpRight className="w-2.5 h-2.5" />
                </a>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
