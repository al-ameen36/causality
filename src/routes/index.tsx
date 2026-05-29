import { createFileRoute } from '@tanstack/react-router'

import { EventItem } from '#/components/event_node'
import { useState } from 'react'
import { DUMMY_GRAPH } from '#/db/dummy_data'
import { SendHorizonal } from 'lucide-react'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  const [nodes] = useState(DUMMY_GRAPH)

  return (
    <div>
      <div className="w-screen py-10 flex justify-center h-[calc(100vh-140px)] overflow-auto gap-[18px]">
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

      <div className="flex justify-center bg-[#121212] py-10 w-full fixed left-1/2 -translate-x-1/2 bottom-0">
        <div className="w-[min(100%,500px)] border-gray-900 bg-gray-300 text-black h-[50px] border border-gray-200 flex justify-center rounded-[10px]">
          <input
            placeholder="How did Nvidia become so valuable ?"
            className="p-2 rounded-[10px_0px_0px_10px] w-full max-w-full"
          />
          <button className="text-gray-300 h-full w-[50px] bg-blue-500 px-2 flex justify-center items-center rounded-[0px_10px_10px_0px]">
            <SendHorizonal />
          </button>
        </div>
      </div>
    </div>
  )
}
