"use client"

import * as React from "react"
import { useState } from "react"
import prettyMs from "pretty-ms"
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  FileCode,
  Info,
  Loader2,
  X,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { NodeIcon } from "./right-sidebar"
import type { WorkflowRun, RunStep } from "./workflow-runs-provider"
import type { NodeType } from "@/features/workflow/nodes/node-registry"

export interface InspectorPanelProps {
  step: RunStep
  run?: WorkflowRun
  onClose?: () => void
  className?: string
}

function formatDuration(ms?: number | null): string | null {
  if (ms === undefined || ms === null || isNaN(ms)) return null
  return prettyMs(Math.max(0, ms))
}

export function InspectorPanel({
  step,
  run,
  onClose,
  className,
}: InspectorPanelProps) {
  const [copied, setCopied] = useState(false)

  const isRunning = step.status === "running"
  const isFailed = step.status === "failed"
  const isInactive = step.status === "pending" || !step.status
  const isDone = step.status === "done"

  const durationMs =
    step.durationMs ??
    step.duration ??
    (step.completedAt && step.startedAt
      ? step.completedAt - step.startedAt
      : undefined)
  const formattedDuration = formatDuration(durationMs)
  const nodeType = (step.type ?? step.nodeType ?? "start") as NodeType

  const hasOutput = step.output !== undefined && step.output !== null
  const hasError = Boolean(step.error) || isFailed
  const hasNothing = !hasOutput && !hasError

  const formattedJson = hasOutput
    ? typeof step.output === "object"
      ? JSON.stringify(step.output, null, 2)
      : String(step.output)
    : ""

  const handleCopy = async () => {
    if (!formattedJson) return
    try {
      await navigator.clipboard.writeText(formattedJson)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Ignore clipboard errors
    }
  }

  return (
    <aside
      aria-label="Step Inspector"
      className={cn(
        "flex size-full flex-col bg-card/60",
        className
      )}
    >
      {/* Inspector Header */}
      <div className="flex h-9 shrink-0 items-center justify-between border-b border-border px-3 py-1.5">
        <div className="flex min-w-0 items-center gap-2">
          <NodeIcon type={nodeType} isLoading={isRunning} />
          <span className="truncate text-xs font-semibold text-foreground">
            {step.title}
          </span>
        </div>
        {onClose && (
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={onClose}
            aria-label="Close inspector"
            className="size-6 text-muted-foreground hover:text-foreground"
          >
            <X className="size-3.5" />
          </Button>
        )}
      </div>

      {/* Inspector Content */}
      <div className="flex-1 space-y-3 overflow-y-auto p-3 text-xs">
        {/* Status & Timing Bar */}
        <div className="grid grid-cols-2 gap-2 rounded-md border border-border/60 bg-muted/20 p-2.5">
          <div>
            <span className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Status
            </span>
            <div className="mt-0.5 flex items-center gap-1.5 font-medium">
              {isRunning && (
                <>
                  <Loader2 className="size-3 animate-spin text-blue-500" />
                  <span className="text-blue-500">Running</span>
                </>
              )}
              {isDone && (
                <>
                  <CheckCircle2 className="size-3 text-emerald-500" />
                  <span className="text-emerald-600 dark:text-emerald-400">Completed</span>
                </>
              )}
              {isFailed && (
                <>
                  <AlertCircle className="size-3 text-destructive" />
                  <span className="font-semibold text-destructive">Failed</span>
                </>
              )}
              {isInactive && (
                <>
                  <Clock className="size-3 text-muted-foreground" />
                  <span className="text-muted-foreground">Pending</span>
                </>
              )}
            </div>
          </div>

          <div>
            <span className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Duration
            </span>
            <span className="mt-0.5 block font-mono">
              {formattedDuration ?? (isRunning ? "Running..." : "—")}
            </span>
          </div>
        </div>

        {/* Output View Section */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <FileCode className="size-3.5" />
              Result
            </span>
            {hasOutput && (
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={handleCopy}
                className="h-5 px-1.5 text-[10px] text-muted-foreground hover:text-foreground"
              >
                {copied ? (
                  <>
                    <Check className="mr-1 size-3 text-emerald-500" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="mr-1 size-3" />
                    Copy
                  </>
                )}
              </Button>
            )}
          </div>

          {/* 1. Error view if failed */}
          {hasError && (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 p-2.5 text-destructive">
              <div className="flex items-center gap-1.5 font-semibold text-[11px]">
                <AlertCircle className="size-3.5 shrink-0" />
                <span>Error</span>
              </div>
              <p className="mt-1 font-mono text-[11px] whitespace-pre-wrap break-all">
                {step.error || "Step failed during execution"}
              </p>
            </div>
          )}

          {/* 2. Formatted JSON output view */}
          {hasOutput && (
            <pre className="max-h-56 overflow-auto rounded-md border border-border/60 bg-muted/40 p-2.5 font-mono text-[11px] text-foreground select-text">
              {formattedJson}
            </pre>
          )}

          {/* 3. Short note when there's nothing */}
          {hasNothing && (
            <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-border/70 bg-muted/10 p-5 text-center text-muted-foreground">
              <Info className="mb-1 size-4 text-muted-foreground/60" />
              <p className="text-xs font-medium">No output or error</p>
              <p className="text-[11px] text-muted-foreground/80">
                This step has not produced any output or error yet.
              </p>
            </div>
          )}
        </div>

        {/* Step Metadata Footer */}
        <div className="space-y-1 border-t border-border/60 pt-2 text-[11px] text-muted-foreground">
          <div className="flex justify-between">
            <span>Node ID</span>
            <span className="font-mono text-foreground">{step.id}</span>
          </div>
          <div className="flex justify-between">
            <span>Node Type</span>
            <span className="font-mono text-foreground">{nodeType}</span>
          </div>
          {run && (
            <div className="flex justify-between">
              <span>Run ID</span>
              <span className="font-mono text-foreground">{run.id.slice(0, 12)}</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}

export default InspectorPanel
