import { useMemo } from "react"
import { useEdges, useNodes } from "@xyflow/react"

import {
  nodeRegistry,
  type NodeType,
  type StepNodeType,
} from "@/features/workflow/nodes/node-registry"

export type UpstreamOutput = {
  token: string
  label: string
  type: NodeType
  nodeId: string
  nodeTitle: string
  path: string
  outputLabel: string
  value?: string
}

/**
 * Hook that returns every output exposed by any node upstream of the selected node.
 * 
 * Follows all connections backward through the graph (transitive ancestors),
 * re-computing whenever nodes or edges connect/disconnect.
 */
export function useUpstreamConnections(
  selectedNode: StepNodeType | null | undefined
): UpstreamOutput[] {
  const nodes = useNodes<StepNodeType>()
  const edges = useEdges()

  return useMemo(() => {
    if (!selectedNode) return []

    // Map each target node to its incoming source node IDs
    const incomingMap = new Map<string, string[]>()
    for (const edge of edges) {
      if (!incomingMap.has(edge.target)) {
        incomingMap.set(edge.target, [])
      }
      incomingMap.get(edge.target)!.push(edge.source)
    }

    // Traverse upstream ancestors via BFS
    const upstreamNodeIds = new Set<string>()
    const visited = new Set<string>([selectedNode.id])
    const queue = [...(incomingMap.get(selectedNode.id) || [])]

    while (queue.length > 0) {
      const currentId = queue.shift()!
      if (visited.has(currentId)) continue
      visited.add(currentId)
      upstreamNodeIds.add(currentId)

      const parents = incomingMap.get(currentId) || []
      for (const parentId of parents) {
        if (!visited.has(parentId)) {
          queue.push(parentId)
        }
      }
    }

    const nodeMap = new Map(nodes.map((n) => [n.id, n]))
    const outputs: UpstreamOutput[] = []

    for (const id of upstreamNodeIds) {
      const node = nodeMap.get(id)
      if (!node) continue

      const def = nodeRegistry[node.data.type]
      if (!def || !def.outputs || def.outputs.length === 0) continue

      for (const output of def.outputs) {
        const actualValue = node.data.values?.[output.path]

        outputs.push({
          token: `{{ ${node.id}.${output.path} }}`,
          label: `${node.data.title} · ${output.label}`,
          type: node.data.type,
          nodeId: node.id,
          nodeTitle: node.data.title,
          path: output.path,
          outputLabel: output.label,
          value: actualValue,
        })
      }
    }

    return outputs
  }, [selectedNode, nodes, edges])
}
