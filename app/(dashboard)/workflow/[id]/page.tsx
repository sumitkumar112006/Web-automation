import { auth } from "@clerk/nextjs/server"
import { notFound } from "next/navigation"
import { ReactFlowProvider } from "@xyflow/react"
import { auth as triggerAuth } from "@trigger.dev/sdk"
import { getWorkflow } from "@/features/workflow/data"
import { Room } from "@/features/workflow/components/room"
import { WorkflowShell } from "@/features/workflow/components/workflow-shell"
import { WorkflowRunsProvider } from "@/features/workflow/components/workflow-runs-provider"
import { liveblocks } from "@/lib/liveblocks"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function WorkflowPage({ params }: PageProps) {
  const { id } = await params
  const { orgId } = await auth()
  if (!orgId) notFound()

  const workflow = await getWorkflow(orgId, id)
  if (!workflow) notFound()

  await liveblocks.getOrCreateRoom(id, {
    organizationId: orgId,
    defaultAccesses: [],
    groupsAccesses: {
      [orgId]: ["room:write"],
    },
  })

  const accessToken = await triggerAuth.createPublicToken({
    scopes: {
      read: {
        tags: [`workflow:${id}`],
      },
    },
    expirationTime: "1h",
  })

  return (
    <Room roomId={id}>
      <ReactFlowProvider>
        <WorkflowRunsProvider workflowId={id} accessToken={accessToken}>
          <WorkflowShell workflowId={id} />
        </WorkflowRunsProvider>
      </ReactFlowProvider>
    </Room>
  )
}

