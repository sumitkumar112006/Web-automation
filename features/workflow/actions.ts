"use server"

import { auth } from "@clerk/nextjs/server"
import { tasks, runs } from "@trigger.dev/sdk"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import * as Sentry from "@sentry/nextjs"

import type { runWorkflowTask } from "@/features/workflow/tasks/run-workflow"
import { createWorkflow, deleteWorkflow, saveWorkflowGraph } from "./data"
import { liveblocks } from "@/lib/liveblocks"
import type { WorkflowGraph } from "@/lib/db/schema"

export async function createWorkflowAction(name: string) {
  const { userId, orgId } = await auth()

  if (!orgId) {
    throw new Error("Unauthorized: No active organization found")
  }
  if (userId) {
    Sentry.setUser({ id: userId, org_id: orgId })
  }

  let workflow
  try {
    workflow = await createWorkflow(orgId, name)
    Sentry.logger.info("Workflow created successfully", {
      "workflow.id": workflow.id,
      "workflow.name": name,
      "org.id": orgId,
    })
  } catch (err) {
    Sentry.captureException(err, {
      tags: { action: "createWorkflowAction" },
      extra: { name, orgId },
    })
    throw err
  }

  revalidatePath("/", "layout")
  redirect(`/workflow/${workflow.id}`)
}

export async function deleteWorkflowAction(id: string) {
  const { userId, orgId } = await auth()

  if (!orgId) {
    throw new Error("No active organization")
  }
  if (userId) {
    Sentry.setUser({ id: userId, org_id: orgId })
  }

  let workflow
  try {
    workflow = await deleteWorkflow(orgId, id)

    if (!workflow) {
      Sentry.logger.warn("Attempted to delete non-existent workflow", {
        "workflow.id": id,
        "org.id": orgId,
      })
      throw new Error("Workflow not found")
    }

    Sentry.logger.info("Workflow deleted successfully", {
      "workflow.id": id,
      "org.id": orgId,
    })
  } catch (err) {
    Sentry.captureException(err, {
      tags: { action: "deleteWorkflowAction" },
      extra: { workflowId: id, orgId },
    })
    throw err
  }

  // The workflow id doubles as its Liveblocks room id - clean it up too.
  try {
    await liveblocks.deleteRoom(id)
  } catch (err) {
    Sentry.logger.warn("Could not delete Liveblocks room", {
      "workflow.id": id,
      error: err instanceof Error ? err.message : String(err),
    })
  }

  revalidatePath("/", "layout")
  return { success: true }
}

export async function runWorkflowAction({
  id,
  graph,
}: {
  id: string
  graph: WorkflowGraph
}) {
  const { userId, orgId, has } = await auth()

  if (!orgId) {
    throw new Error("No active organization")
  }
  if (userId) {
    Sentry.setUser({ id: userId, org_id: orgId })
  }

  // Stop workflows containing an Agent node from running unless the org is on the Pro plan
  const hasAgentNode = graph?.nodes?.some(
    (node) => node.data?.type === "agent" || (node as { type?: string }).type === "agent"
  )

  if (hasAgentNode) {
    const isPro = has({ plan: "pro" }) || has({ plan: "org:pro" })
    if (!isPro) {
      Sentry.logger.warn("Workflow run blocked: Agent node requires Pro plan", {
        "workflow.id": id,
        "org.id": orgId,
      })
      throw new Error("The Agent node requires a Pro plan subscription")
    }
  }

  try {
    Sentry.logger.info("Triggering workflow run", {
      "workflow.id": id,
      "org.id": orgId,
      nodeCount: graph?.nodes?.length ?? 0,
      edgeCount: graph?.edges?.length ?? 0,
    })

    await saveWorkflowGraph({ orgId, id, graph })

    const handle = await tasks.trigger<typeof runWorkflowTask>(
      "run-workflow",
      {
        workflowId: id,
        orgId,
      },
      {
        tags: [`workflow:${id}`],
      }
    )

    Sentry.logger.info("Workflow run dispatched to Trigger.dev", {
      "workflow.id": id,
      "org.id": orgId,
      "trigger.run_id": handle.id,
    })

    return { id: handle.id }
  } catch (err) {
    Sentry.captureException(err, {
      tags: { action: "runWorkflowAction" },
      extra: { workflowId: id, orgId },
    })
    throw err
  }
}

export async function cancelWorkflowRunAction(runId: string) {
  const { userId, orgId } = await auth()
  if (!orgId) throw new Error("No active organization")
  if (userId) {
    Sentry.setUser({ id: userId, org_id: orgId })
  }

  try {
    Sentry.logger.info("Cancelling workflow run", {
      "trigger.run_id": runId,
      "org.id": orgId,
    })
    await runs.cancel(runId)
  } catch (err) {
    Sentry.captureException(err, {
      tags: { action: "cancelWorkflowRunAction" },
      extra: { runId, orgId },
    })
    throw err
  }
}

