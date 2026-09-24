import { Plus, Workflow } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

export default function Page() {
  return (
    <Empty className="flex-1 min-h-[calc(100svh-3rem)] md:min-h-svh p-4 sm:p-6 md:p-8">
      <EmptyHeader className="max-w-xs sm:max-w-sm px-2">
        <EmptyMedia variant="icon" className="size-9 sm:size-10 rounded-lg">
          <Workflow className="size-4 sm:size-5" />
        </EmptyMedia>
        <EmptyTitle className="text-base sm:text-lg font-semibold text-foreground">
          No workflow selected
        </EmptyTitle>
        <EmptyDescription className="text-xs sm:text-sm text-muted-foreground text-balance">
          Select a workflow from the sidebar or create a new one to get started.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent className="mt-1">
        <Button size="default" className="h-9 px-4 text-sm font-medium">
          <Plus className="size-4 mr-1.5" />
          New workflow
        </Button>
      </EmptyContent>
    </Empty>
  )
}


