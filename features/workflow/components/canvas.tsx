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
  type NodeTypes,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import { useTheme } from "next-themes"
import { StepNode } from "./step-node"
import type { StepNodeType } from "@/features/workflow/nodes/node-registry"

interface CanvasProps {
  workflowId: string
}

const nodeTypes: NodeTypes = {
  step: StepNode,
}

const initialNodes: StepNodeType[] = [
  {
    id: "1",
    type: "step",
    data: {
      type: "start",
      kind: "trigger",
      title: "Start",
      values: {},
    },
    position: { x: 250, y: 100 },
  },
]

const initialEdges: Edge[] = []

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
        nodeTypes={nodeTypes}
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
