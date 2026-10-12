"use client"

import * as React from "react"
import { useState } from "react"
import prettyMs from "pretty-ms"
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  Terminal,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { NodeIcon } from "./right-sidebar"
import {
  useWorkflowRunsSafe,
  type WorkflowRun,
  type RunStep,
} from "./workflow-runs-provider"
import type { NodeType } from "@/features/workflow/nodes/node-registry"

export interface LogsPanelProps {
  runs?: WorkflowRun[]
  selectedStepId?: string | null
  onSelectStep?: (stepId: string) => void
  className?: string
}

function formatDuration(ms?: number | null): string | null {
  if (ms === undefined || ms === null || isNaN(ms)) return null
  return prettyMs(Math.max(0, ms))
}

function RunStatusBadge({
  status,
  isLive,
}: {
  status?: string
  isLive?: boolean
}) {
  if (isLive || status === "EXECUTING" || status === "RUNNING") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-2 py-0.5 text-[11px] font-medium text-blue-600 dark:text-blue-400">
        <Loader2 className="size-3 animate-spin" />
        Running
      </span>
    )
  }

  if (status === "COMPLETED") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
        <CheckCircle2 className="size-3" />
        Completed
      </span>
    )
  }

  if (status === "FAILED" || status === "CRASHED" || status === "SYSTEM_FAILURE") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] font-medium text-destructive">
        <AlertCircle className="size-3" />
        Failed
      </span>
    )
  }

  if (status === "QUEUED" || status === "WAITING" || status === "DELAYED") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-600 dark:text-amber-400">
        <Clock className="size-3" />
        Queued
      </span>
    )
  }

  return (
    <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
      {status ?? "Unknown"}
    </span>
  )
}

function StepRow({
  step,
  isSelected,
  onSelect,
}: {
  step: RunStep
  isSelected: boolean
  onSelect: () => void
}) {
  const isRunning = step.status === "running"
  const isFailed = step.status === "failed"
  const isInactive = step.status === "pending" || !step.status

  const durationMs =
    step.durationMs ??
    step.duration ??
    (step.completedAt && step.startedAt
      ? step.completedAt - step.startedAt
      : undefined)

  const formattedDuration = formatDuration(durationMs)
  const nodeType = (step.type ?? step.nodeType ?? "start") as NodeType

  return (
    <div
      role="button"
      tabIndex={0}
      data-selected={isSelected ? "true" : "false"}
      data-step-id={step.id}
      data-status={step.status}
      aria-pressed={isSelected}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onSelect()
        }
      }}
      className={cn(
        "group flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-xs transition-colors cursor-pointer select-none",
        // Default border & background
        "border-border/40 bg-card/60 hover:bg-muted/70",
        // Inactive: looks inactive if it never ran
        isInactive && "opacity-50 text-muted-foreground hover:opacity-75 bg-muted/20 border-transparent",
        // Running: spins while running
        isRunning && "border-blue-500/50 bg-blue-500/10 text-foreground shadow-xs",
        // Failed: turns red if it failed
        isFailed && "border-destructive/60 bg-destructive/10 text-destructive hover:bg-destructive/15",
        // Selected: clicking a step selects it
        isSelected && "ring-2 ring-primary ring-offset-1 bg-accent text-accent-foreground font-medium shadow-xs"
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2.5">
        <NodeIcon
          type={nodeType}
          isLoading={isRunning}
          className={cn(
            isFailed && "bg-destructive text-destructive-foreground",
            isInactive && "opacity-60 grayscale"
          )}
        />
        <div className="flex min-w-0 flex-col">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "truncate font-medium",
                isFailed && "text-destructive font-semibold",
                isInactive && "text-muted-foreground"
              )}
            >
              {step.title}
            </span>
          </div>
          {isFailed && step.error && (
            <span className="truncate text-[10px] text-destructive/90 max-w-md">
              {step.error}
            </span>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {formattedDuration ? (
          <span
            className={cn(
              "font-mono text-[11px]",
              isFailed
                ? "text-destructive"
                : isInactive
                ? "text-muted-foreground/60"
                : "text-muted-foreground"
            )}
          >
            {formattedDuration}
          </span>
        ) : isRunning ? (
          <span className="font-mono text-[11px] text-blue-500">running...</span>
        ) : null}
      </div>
    </div>
  )
}

export function LogsPanel({
  runs: propRuns,
  selectedStepId: propSelectedStepId,
  onSelectStep,
  className,
}: LogsPanelProps) {
  const context = useWorkflowRunsSafe()
  const runs = propRuns ?? context?.runs ?? []

  // Internal selection fallback if used standalone without ConsolePanel
  const [internalSelectedStepId, setInternalSelectedStepId] = useState<string | null>(null)
  const isControlled = propSelectedStepId !== undefined
  const selectedStepId = isControlled ? propSelectedStepId : internalSelectedStepId

  const handleStepClick = (stepId: string) => {
    if (onSelectStep) {
      onSelectStep(stepId)
    } else {
      setInternalSelectedStepId((prev) => (prev === stepId ? null : stepId))
    }
  }

  if (runs.length === 0) {
    return (
      <div
        className={cn(
          "flex size-full flex-col items-center justify-center gap-2 p-6 text-center text-muted-foreground",
          className
        )}
      >
        <div className="flex size-9 items-center justify-center rounded-lg bg-muted/60">
          <Terminal className="size-4.5 text-muted-foreground/70" />
        </div>
        <div className="flex flex-col gap-0.5">
          <p className="text-xs font-semibold text-foreground">No workflow runs yet</p>
          <p className="text-[11px] text-muted-foreground">
            Trigger a run from the sidebar to inspect execution steps and logs.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("flex flex-col divide-y divide-border/50", className)}>
      {runs.map((run, index) => {
        const runDuration =
          run.durationMs ??
          (run.finishedAt && run.startedAt
            ? new Date(run.finishedAt).getTime() - new Date(run.startedAt).getTime()
            : undefined)
        const formattedRunDuration = formatDuration(runDuration)
        const runNumber = runs.length - index

        return (
          <div key={run.id} className="flex flex-col gap-2 p-3">
            {/* Run Header */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <RunStatusBadge status={run.status} isLive={run.isLive} />
                <span className="font-semibold text-foreground">
                  Run #{runNumber}
                </span>
                <span className="font-mono text-[11px] text-muted-foreground">
                  {run.id.slice(0, 10)}
                </span>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                {formattedRunDuration && (
                  <span className="font-mono">{formattedRunDuration}</span>
                )}
                <span>
                  {new Date(run.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </span>
              </div>
            </div>

            {/* Below it, its steps */}
            <div className="flex flex-col gap-1.5 pl-2">
              {run.steps.length === 0 ? (
                <div className="px-2 py-1.5 text-[11px] italic text-muted-foreground">
                  No steps registered
                </div>
              ) : (
                run.steps.map((step) => {
                  const isSelected = selectedStepId === step.id
                  return (
                    <StepRow
                      key={step.id}
                      step={step}
                      isSelected={isSelected}
                      onSelect={() => handleStepClick(step.id)}
                    />
                  )
                })
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default LogsPanel
