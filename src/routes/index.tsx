import { createFileRoute } from '@tanstack/react-router'
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
} from "@xyflow/react";

import "@xyflow/react/dist/style.css";

export const Route = createFileRoute("/")({
  component: Home,
});

const initialNodes = [
  {
    id: "start",
    position: { x: 400, y: 200 },
    data: { label: "+" },
    type: "input",
  },
];

function Home() {
  return (
    <div className="w-screen h-screen">
      <ReactFlow
        fitView
        nodes={initialNodes}
        edges={[]}
      >
        <Background />
        <MiniMap />
        <Controls />
      </ReactFlow>
    </div>
  );
}