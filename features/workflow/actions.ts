"use server"

import { auth } from "@clerk/nextjs/server"
import { auth as triggerAuth, tasks } from "@trigger.dev/sdk"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import type { helloWorldTask } from "@/src/trigger/example"
import { createWorkflow, deleteWorkflow } from "./data"
import { liveblocks } from "@/lib/liveblocks"

export async function createWorkflowAction(name: string) {
  const { orgId } = await auth()

  if (!orgId) {
    throw new Error("Unauthorized: No active organization found")
  }

  const workflow = await createWorkflow(orgId, name)

  revalidatePath("/", "layout")
  redirect(`/workflow/${workflow.id}`)
}

export async function deleteWorkflowAction(id: string) {
  const { orgId } = await auth()

  if (!orgId) {
    throw new Error("No active organization")
  }

  const workflow = await deleteWorkflow(orgId, id)

  if (!workflow) {
    throw new Error("Workflow not found")
  }

  // The workflow id doubles as its Liveblocks room id - clean
  // it up too.
  await liveblocks.deleteRoom(id)

  revalidatePath("/", "layout")
  redirect("/")
}

export async function runWorkflowAction(message?: string) {
  const { userId, orgId } = await auth()

  if (!userId && !orgId) {
    throw new Error("Unauthorized: Please sign in")
  }

  const handle = await tasks.trigger<typeof helloWorldTask>("hello-world", {
    message: message || "Triggered from workflow inspector",
  })

  const publicAccessToken =
    handle.publicAccessToken ||
    (await triggerAuth.createPublicToken({
      scopes: { read: { runs: [handle.id] } },
    }))

  return {
    id: handle.id,
    publicAccessToken,
    success: true,
  }
}

