"use client"

import { useEffect } from "react"
import { AlertCircle, RotateCcw } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <Empty className="flex-1 min-h-[calc(100svh-3rem)] md:min-h-svh p-4 sm:p-6 md:p-8">
      <EmptyHeader className="max-w-xs sm:max-w-sm px-2">
        <EmptyMedia variant="icon" className="size-9 sm:size-10 rounded-lg text-destructive">
          <AlertCircle className="size-4 sm:size-5" />
        </EmptyMedia>
        <EmptyTitle className="text-base sm:text-lg font-semibold text-foreground">
          Something went wrong
        </EmptyTitle>
        <EmptyDescription className="text-xs sm:text-sm text-muted-foreground text-balance">
          An error occurred while loading this workflow. Please try again.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent className="mt-1">
        <Button
          onClick={() => reset()}
          size="default"
          className="h-9 px-4 text-sm font-medium"
        >
          <RotateCcw className="size-4 mr-1.5" />
          Try again
        </Button>
      </EmptyContent>
    </Empty>
  )
}
