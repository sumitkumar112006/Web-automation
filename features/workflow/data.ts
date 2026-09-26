import { and, desc, eq } from "drizzle-orm"

import { db } from "@/lib/db"
import { workflows } from "@/lib/db/schema"

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

