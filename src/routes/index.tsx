import { createFileRoute } from "@tanstack/react-router";
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  useEdgesState,
  useNodesState,
  type Edge,
  type Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { AddNode } from "#/components/add_node";
import { EventNode } from "#/components/event_node";

export const Route = createFileRoute("/")({ component: Home });

const nodeTypes = { addNode: AddNode, eventNode: EventNode };

const DUMMY_STEPS = [
  "A decade of cheap debt fuels reckless expansion",
  "Interest rates rise sharply; refinancing becomes impossible",
  "Core product line loses market share to a cheaper rival",
  "Board replaces CEO; new leadership cuts R&D",
  "Key engineers resign; product quality declines",
  "Largest client terminates contract",
  "Credit rating downgraded to junk",
];

const NODE_GAP = 140;

function buildTimeline(outcome: string): { nodes: Node[]; edges: Edge[] } {
  const labels = [...DUMMY_STEPS, outcome];
  const total = labels.length;

  const nodes: Node[] = labels.map((label, i) => ({
    id: `event-${i}`,
    type: "eventNode",
    position: { x: 80, y: i * NODE_GAP },
    data: { label, index: i, total },
  }));

  const edges: Edge[] = labels.slice(0, -1).map((_, i) => ({
    id: `e-${i}`,
    source: `event-${i}`,
    target: `event-${i + 1}`,
    style: { stroke: "#d4d4d8", strokeWidth: 1.5 },
  }));

  return { nodes, edges };
}

const initialNodes: Node[] = [
  {
    id: "add-0",
    type: "addNode",
    position: { x: 80, y: 120 },
    data: {},
  },
];

function Home() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  const handleCreate = (outcome: string) => {
    const { nodes: timelineNodes, edges: timelineEdges } = buildTimeline(outcome);
    setNodes(timelineNodes);
    setEdges(timelineEdges);
  };

  const hydratedNodes = nodes.map((node) => {
    if (node.type !== "addNode") return node;
    return { ...node, data: { ...node.data, onCreate: handleCreate } };
  });

  return (
    <div className="h-screen w-screen bg-zinc-50">
      <ReactFlow
        nodes={hydratedNodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        fitViewOptions={{ padding: 0.25 }}
      >
        <Background />
        <MiniMap />
        <Controls />
      </ReactFlow>
    </div>
  );
}