import { and, desc, eq } from "drizzle-orm"

import { db } from "@/lib/db"
import type { WorkflowGraph } from "@/lib/db/schema"
import { workflows } from "@/lib/db/schema"
import { validateGraph } from "./lib/validate-graph"

export async function saveWorkflowGraph({
  orgId,
  id,
  graph,
}: {
  orgId: string
  id: string
  graph: WorkflowGraph
}) {
  const problems = validateGraph(graph)
  if (problems.length > 0) throw new Error(problems.join(" "))

  await db
    .update(workflows)
    .set({ graph, updatedAt: new Date() })
    .where(and(eq(workflows.id, id), eq(workflows.orgId, orgId)))
}

export async function getWorkflow(orgId: string, id: string) {
  const [workflow] = await db
    .select()
    .from(workflows)
    .where(and(eq(workflows.id, id), eq(workflows.orgId, orgId)))

  return workflow
}

export function listWorkflows(orgId: string) {
  return db
    .select()
    .from(workflows)
    .where(eq(workflows.orgId, orgId))
    .orderBy(desc(workflows.createdAt))
}

export async function createWorkflow(orgId: string, name: string) {
  const [created] = await db
    .insert(workflows)
    .values({
      orgId,
      name,
    }) 
    .returning()

  return created
}

export async function deleteWorkflow(orgId: string, id: string) {
  const [deleted] = await db
    .delete(workflows)
    .where(and(eq(workflows.id, id), eq(workflows.orgId, orgId)))
    .returning()

  return deleted
}


