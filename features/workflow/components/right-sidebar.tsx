"use client"

import * as React from "react"
import { useRealtimeRun } from "@trigger.dev/react-hooks"
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Loader2,
  Play,
  Terminal,
} from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { runWorkflowAction } from "@/features/workflow/actions"
import type { helloWorldTask } from "@/src/trigger/example"

export function RightSidebar() {
  const [isPending, startTransition] = React.useTransition()
  const [runSession, setRunSession] = React.useState<{
    runId: string
    publicAccessToken: string
  } | null>(null)
  const [copied, setCopied] = React.useState(false)

  // Realtime subscription to the triggered task run
  const { run, error: realtimeError } = useRealtimeRun<typeof helloWorldTask>(
    runSession?.runId ?? "",
    {
      accessToken: runSession?.publicAccessToken ?? "",
      enabled: Boolean(runSession?.runId && runSession?.publicAccessToken),
      onComplete: (completedRun) => {
        if (completedRun.status === "COMPLETED") {
          toast.success("Task completed successfully!")
        } else if (
          completedRun.status === "FAILED" ||
          completedRun.status === "CRASHED" ||
          completedRun.status === "SYSTEM_FAILURE"
        ) {
          toast.error("Task execution failed")
        }
      },
    }
  )

  const handleRun = () => {
    startTransition(async () => {
      try {
        const result = await runWorkflowAction()
        if (result.success && result.id && result.publicAccessToken) {
          setRunSession({
            runId: result.id,
            publicAccessToken: result.publicAccessToken,
          })
          toast.success("Task run dispatched", {
            description: `Run ID: ${result.id}`,
          })
        }
      } catch (error) {
        toast.error("Failed to trigger task", {
          description:
            error instanceof Error ? error.message : "Something went wrong",
        })
      }
    })
  }

  const handleCopyRunId = async () => {
    if (!runSession?.runId) return
    await navigator.clipboard.writeText(runSession.runId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success("Run ID copied to clipboard")
  }

  const isRunning =
    isPending ||
    run?.status === "EXECUTING" ||
    run?.status === "QUEUED" ||
    run?.status === "DEQUEUED" ||
    run?.status === "WAITING" ||
    run?.status === "PENDING_VERSION"

  const renderStatusBadge = () => {
    if (!run && !isPending && !runSession) {
      return (
        <Badge variant="outline" className="text-muted-foreground">
          Idle
        </Badge>
      )
    }

    if (isPending && !run) {
      return (
        <Badge variant="secondary" className="gap-1 animate-pulse">
          <Loader2 className="size-3 animate-spin" />
          Dispatching
        </Badge>
      )
    }

    switch (run?.status) {
      case "COMPLETED":
        return (
          <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 gap-1">
            <CheckCircle2 className="size-3" />
            Completed
          </Badge>
        )
      case "EXECUTING":
        return (
          <Badge className="bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/20 gap-1 animate-pulse">
            <Loader2 className="size-3 animate-spin" />
            Executing
          </Badge>
        )
      case "QUEUED":
      case "DEQUEUED":
      case "WAITING":
      case "PENDING_VERSION":
        return (
          <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20 gap-1">
            <Clock className="size-3" />
            Queued
          </Badge>
        )
      case "FAILED":
      case "CRASHED":
      case "SYSTEM_FAILURE":
      case "TIMED_OUT":
        return (
          <Badge variant="destructive" className="gap-1">
            <AlertCircle className="size-3" />
            Failed
          </Badge>
        )
      case "CANCELED":
        return (
          <Badge variant="outline" className="gap-1 text-muted-foreground">
            Canceled
          </Badge>
        )
      default:
        return (
          <Badge variant="secondary" className="gap-1">
            {run?.status ?? "Running"}
          </Badge>
        )
    }
  }

  return (
    <div className="flex size-full flex-col bg-background/95 divide-y divide-border/60">
      {/* Header & Action Button */}
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="size-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold tracking-tight">
              Task Inspector
            </h3>
          </div>
          {renderStatusBadge()}
        </div>

        <Button
          onClick={handleRun}
          disabled={isRunning}
          className="w-full gap-2 shadow-xs cursor-pointer font-medium"
        >
          {isRunning ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Play className="size-4 fill-current" />
          )}
          {isRunning ? "Running Task..." : "Run Workflow Task"}
        </Button>
      </div>

      {/* Realtime Feedback Section */}
      <ScrollArea className="flex-1 p-4">
        {runSession ? (
          <div className="space-y-4">
            {/* Run Info Card */}
            <Card className="border-border/60 bg-muted/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Active Run
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">Run ID:</span>
                  <div className="flex items-center gap-1.5 font-mono text-[11px] bg-background px-2 py-0.5 rounded border border-border/80">
                    <span className="truncate max-w-[140px]">
                      {runSession.runId}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyRunId}
                      className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                      title="Copy Run ID"
                    >
                      {copied ? (
                        <Check className="size-3 text-emerald-500" />
                      ) : (
                        <Copy className="size-3" />
                      )}
                    </button>
                  </div>
                </div>

                {run?.startedAt && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Started:</span>
                    <span className="font-mono text-foreground/90">
                      {new Date(run.startedAt).toLocaleTimeString()}
                    </span>
                  </div>
                )}

                {run?.finishedAt && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Finished:</span>
                    <span className="font-mono text-foreground/90">
                      {new Date(run.finishedAt).toLocaleTimeString()}
                    </span>
                  </div>
                )}

                {run?.durationMs !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Duration:</span>
                    <span className="font-mono text-foreground/90">
                      {run.durationMs} ms
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Task Output / Realtime Result */}
            {run?.output && (
              <Card className="border-emerald-500/30 bg-emerald-500/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="size-3.5" />
                    Task Output
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="p-2.5 rounded-lg bg-background/80 border border-border/60 text-xs font-mono text-foreground/90 overflow-x-auto whitespace-pre-wrap">
                    {JSON.stringify(run.output, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            )}

            {/* Error Feedback */}
            {(run?.error || realtimeError) && (
              <Card className="border-destructive/30 bg-destructive/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-semibold text-destructive flex items-center gap-1.5">
                    <AlertCircle className="size-3.5" />
                    Execution Error
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs font-mono text-destructive">
                    {realtimeError?.message ||
                      (typeof run?.error === "string"
                        ? run.error
                        : JSON.stringify(run?.error, null, 2))}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground space-y-2">
            <div className="size-10 rounded-full bg-muted/40 flex items-center justify-center border border-border/40">
              <Play className="size-4 text-muted-foreground/60 ml-0.5" />
            </div>
            <p className="text-xs font-medium text-foreground/80">
              Ready to Run
            </p>
            <p className="text-[11px] text-muted-foreground max-w-[180px]">
              Click &quot;Run Workflow Task&quot; to trigger the background task
              and stream realtime feedback.
            </p>
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
