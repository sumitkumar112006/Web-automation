import { Spinner } from "@/components/ui/spinner"

export default function Loading() {
  return (
    <div className="flex flex-1 min-h-[calc(100svh-3rem)] md:min-h-svh items-center justify-center p-4 sm:p-6 md:p-8">
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <Spinner className="size-6 text-primary" />
        <span className="text-xs sm:text-sm">Loading workflow...</span>
      </div>
    </div>
  )
}
