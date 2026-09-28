import { Room } from "@/features/workflow/components/room"
import { WorkflowShell } from "@/features/workflow/components/workflow-shell"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function WorkflowPage({ params }: PageProps) {
  const { id } = await params

  return (
    <Room roomId={id}>
      <WorkflowShell workflowId={id} />
    </Room>
  )
}
