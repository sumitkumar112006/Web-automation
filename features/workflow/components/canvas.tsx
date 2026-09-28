"use client"

import * as React from "react"
import {
  ReactFlow,
  Controls,
  Background,
  BackgroundVariant,
  MiniMap,
  Panel,
  ConnectionLineType,
  type ColorMode,
  type Edge,
  type NodeTypes,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import "@liveblocks/react-ui/styles.css"
import "@liveblocks/react-flow/styles.css"
import { AvatarStack } from "@liveblocks/react-ui"
import { useLiveblocksFlow, Cursors } from "@liveblocks/react-flow"
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

const emptySubscribe = () => () => { }

export function Canvas({ workflowId }: CanvasProps) {
  const { resolvedTheme } = useTheme()
  const mounted = React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  )

  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onDelete,
  } = useLiveblocksFlow<StepNodeType, Edge>({
    suspense: true,
    nodes: {
      initial: initialNodes,
    },
    edges: {
      initial: initialEdges,
    },
  })

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
        onDelete={onDelete}
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
        <MiniMap />
        <Controls />
        <Cursors />
        <Panel
          position="top-right"
        >
          <AvatarStack />
        </Panel>
      </ReactFlow>
    </div>
  )
}
