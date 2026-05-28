import { createFileRoute } from '@tanstack/react-router'

import { EventItem } from '#/components/event_node'
import { useState } from 'react'
import { DUMMY_GRAPH } from '#/db/dummy_data'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  const [nodes] = useState(DUMMY_GRAPH)
  const [edges] = useState([])

  return (
    <div className="h-screen w-screen py-10 flex justify-center max-h-[80vh] overflow-auto gap-[18px]">
      <div className="grid gap-10">
        {nodes.length > 0
          ? nodes.map((node, i) => (
              <EventItem
                key={node.id}
                data={{
                  ...node,
                  isFirst: i === 0,
                  isLast: i === nodes.length - 1,
                }}
              />
            ))
          : null}
      </div>
    </div>
  )
}
