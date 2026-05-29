import type { EventWithMetadata } from '#/types/nodes'
import { cn } from '#/utils/utils'
import { ArrowUpRight, FolderOpen, Link2 } from 'lucide-react' // Optional: standard lucide icons

type Props = {
  data: EventWithMetadata
}

export function EventCard({ data }: Props) {
  const isDark = data.isFirst

  return (
    <div className="flex flex-col gap-4 max-w-2xl w-full">
      {/* Main Parent Card */}
      <div
        className={cn(
          'relative p-6 rounded-2xl border transition-all duration-200 shadow-sm',
          'bg-slate-950 border-slate-800 text-slate-100 shadow-slate-950/50',
        )}
      >
        {/* Card Header / Label */}
        <h2
          className={cn(
            'text-base font-semibold tracking-tight mb-2',
            'text-white',
          )}
        >
          {data.label}
        </h2>

        {/* Card Description */}
        <p className={cn('text-sm leading-relaxed mb-6', 'text-slate-400')}>
          {data.description}
        </p>

        {/* Sources Section */}
        {data.sources && data.sources.length > 0 && (
          <div className="flex flex-wrap gap-2 items-center pt-4 border-t border-dashed border-slate-200 dark:border-slate-800">
            <span className="text-xs font-medium text-slate-400 flex items-center gap-1 mr-1">
              <Link2 className="w-3 h-3" /> Sources:
            </span>
            {data.sources.map((source, idx) => (
              <a
                key={idx}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  'inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors',
                  'bg-slate-800 hover:bg-slate-800 text-slate-100 border border-slate-800',
                )}
              >
                {source.title.split('—')[0].trim()}{' '}
                {/* Grabs company name like 'McKinsey' */}
                <ArrowUpRight className="w-2.5 h-2.5 opacity-60" />
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Nested Children / Contributory Factors */}
      {data.children && data.children.length > 0 && (
        <div className="pl-6 md:pl-8 border-l-2 border-slate-200 dark:border-slate-800 flex flex-col gap-3 ml-4 mt-1">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
            <FolderOpen className="w-3 h-3" /> Secondary ({data.children.length}
            )
          </div>

          <div className="grid gap-3 sm:grid-cols-1">
            {data.children.map((child) => (
              <div
                key={child.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 dark:bg-slate-900/20 dark:border-slate-800"
              >
                <h3 className="text-xs font-bold text-slate-900 dark:text-slate-200 mb-1">
                  {child.label}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal">
                  {child.description}
                </p>

                {/* Child Sources */}
                {child.sources && child.sources.length > 0 && (
                  <div className="flex flex-wrap gap-2 items-center pt-4 border-t border-dashed border-slate-200 dark:border-slate-800">
                    <span className="text-xs font-medium text-slate-400 flex items-center gap-1 mr-1">
                      <Link2 className="w-3 h-3" /> Sources:
                    </span>
                    {child.sources.map((source, idx) => (
                      <a
                        key={idx}
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                          'inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors',
                          'bg-slate-900 hover:bg-slate-800 text-slate-100 border border-slate-800',
                        )}
                      >
                        {source.title.split('—')[0].trim()}{' '}
                        {/* Grabs company name like 'McKinsey' */}
                        <ArrowUpRight className="w-2.5 h-2.5 opacity-60" />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
