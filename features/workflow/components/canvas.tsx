"use client"

import * as React from "react"
import {
  ReactFlow,
  Controls,
  Background,
  BackgroundVariant,
  MiniMap,
  Panel,
  addEdge,
  useNodesState,
  useEdgesState,
  ConnectionLineType,
  type ColorMode,
  type Connection,
  type Edge,
  type Node,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import { useTheme } from "next-themes"

interface CanvasProps {
  workflowId: string
}

const initialNodes: Node[] = [
  {
    id: "1",
    type: "input",
    data: { label: "Trigger: Manual Start" },
    position: { x: 250, y: 25 },
  },
  {
    id: "2",
    data: { label: "Browser Action: Open URL" },
    position: { x: 250, y: 125 },
  },
  {
    id: "3",
    data: { label: "Browser Action: Extract Data" },
    position: { x: 100, y: 225 },
  },
  {
    id: "4",
    type: "output",
    data: { label: "Output: Result Log" },
    position: { x: 400, y: 225 },
  },
]

const initialEdges: Edge[] = [
  { id: "e1-2", source: "1", target: "2", animated: true },
  { id: "e2-3", source: "2", target: "3" },
  { id: "e2-4", source: "2", target: "4" },
]

const emptySubscribe = () => () => {}

export function Canvas({ workflowId }: CanvasProps) {
  const { resolvedTheme } = useTheme()
  const mounted = React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  )

  const [nodes, , onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  const onConnect = React.useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  )

  const colorMode: ColorMode =
    mounted && resolvedTheme ? (resolvedTheme as ColorMode) : "light"

  return (
    <div className="size-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        colorMode={colorMode}
        connectionLineType={ConnectionLineType.SmoothStep}
        connectionLineStyle={{ stroke: "var(--border)" }}
        defaultEdgeOptions={{
          type: "smoothstep",
          style: { stroke: "var(--border)" },
        }}
        style={
          {
            "--xy-background-color": "var(--background)",
            "--xy-edge-stroke-width": 2,
            "--xy-connectionline-stroke-width": 2,
          } as React.CSSProperties
        }

        maxZoom={1}
        fitView
      >
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
        <Controls />
        <MiniMap />
        <Panel
          position="top-right"
          className="rounded-md border border-border/80 bg-background/80 px-3 py-1.5 text-xs text-muted-foreground shadow-xs backdrop-blur-xs"
        >
          Workflow:{" "}
          <span className="font-mono font-medium text-foreground">
            {workflowId}
          </span>
        </Panel>
      </ReactFlow>
    </div>
  )
}
