import type { EventWithMetadata } from '#/types/nodes'
import { cn } from '#/utils/utils'
import styles from '#/styles/event.module.css'

type Props = {
  data: EventWithMetadata
}

export function EventItem({ data }: Props) {
  const className = cn(
    'p-6 rounded-xl max-w-[400px] border border-blue-900',
    data.isFirst ? 'bg-black/93' : 'bg-gray-200',
  )
  return (
    <div className={[className, styles.event_item].join(' ')}>
      <time className="absolute left-[-160px] top-[-6px] text-nowrap text-gray-400 text-sm">
        Wed 3rd Oct, 1905
      </time>
      <h2
        className={cn(
          'text-sm font-bold mb-8',
          data.isFirst ? 'text-white' : 'text-black',
        )}
      >
        {data.label}
      </h2>
      <p className={cn(data.isFirst ? 'text-gray-100' : 'text-gray-700')}>
        {data.description}
      </p>
    </div>
  )
}
