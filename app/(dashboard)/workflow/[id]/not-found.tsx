import Link from "next/link"
import { FileQuestion, Home } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

export default function NotFound() {
  return (
    <Empty className="flex-1 min-h-[calc(100svh-3rem)] md:min-h-svh p-4 sm:p-6 md:p-8">
      <EmptyHeader className="max-w-xs sm:max-w-sm px-2">
        <EmptyMedia variant="icon" className="size-9 sm:size-10 rounded-lg">
          <FileQuestion className="size-4 sm:size-5" />
        </EmptyMedia>
        <EmptyTitle className="text-base sm:text-lg font-semibold text-foreground">
          Workflow not found
        </EmptyTitle>
        <EmptyDescription className="text-xs sm:text-sm text-muted-foreground text-balance">
          The workflow you are looking for doesn&apos;t exist or has been removed.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent className="mt-1">
        <Button asChild size="default" className="h-9 px-4 text-sm font-medium">
          <Link href="/">
            <Home className="size-4 mr-1.5" />
            Back to dashboard
          </Link>
        </Button>
      </EmptyContent>
    </Empty>
  )
}
