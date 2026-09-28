import { auth } from "@clerk/nextjs/server"
import { notFound } from "next/navigation"
import { getWorkflow } from "@/features/workflow/data"
import { Room } from "@/features/workflow/components/room"
import { WorkflowShell } from "@/features/workflow/components/workflow-shell"
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
    defaultAccesses: [],
    groupsAccesses: {
      [orgId]: ["room:write"],
    },
  })

  return (
    <Room roomId={id}>
      <WorkflowShell workflowId={id} />
    </Room>
  )
}
