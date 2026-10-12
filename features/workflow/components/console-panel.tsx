"use client"

import * as React from "react"
import { useState } from "react"
import { Terminal, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { LogsPanel } from "./logs-panel"
import { InspectorPanel } from "./inspector-panel"
import {
  useWorkflowRunsSafe,
  type WorkflowRun,
  type RunStep,
} from "./workflow-runs-provider"

export interface ConsolePanelProps {
  workflowId?: string
  className?: string
}

export function ConsolePanel({
  className,
}: ConsolePanelProps) {
  // ConsolePanel owns the selection
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null)

  const context = useWorkflowRunsSafe()
  const runs = context?.runs ?? []
  const isLive = context?.isLive ?? false

  const handleSelectStep = (stepId: string) => {
    // Clicking a step selects it, clicking again deselects
    setSelectedStepId((prev) => (prev === stepId ? null : stepId))
  }

  // Find the selected step data across all runs
  let selectedStepData: { step: RunStep; run: WorkflowRun } | null = null
  if (selectedStepId) {
    for (const run of runs) {
      const step = run.steps.find((s) => s.id === selectedStepId)
      if (step) {
        selectedStepData = { step, run }
        break
      }
    }
  }

  return (
    <div
      className={cn(
        "flex size-full flex-col overflow-hidden bg-background border-t border-border",
        className
      )}
    >
      {/* Console Header Bar */}
      <div className="flex h-8 shrink-0 items-center justify-between border-b border-border/60 bg-card/60 px-3 text-xs">
        <div className="flex items-center gap-2">
          <Terminal className="size-3.5 text-muted-foreground" />
          <span className="font-semibold text-foreground">Console</span>
          {isLive && (
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-medium text-blue-600 dark:text-blue-400">
              <span className="size-1.5 rounded-full bg-blue-500 animate-pulse" />
              Live
            </span>
          )}
          <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            {runs.length} {runs.length === 1 ? "run" : "runs"}
          </span>
        </div>

        {selectedStepId && (
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-muted-foreground">
              Selected:{" "}
              <span className="font-medium text-foreground">
                {selectedStepData?.step.title ?? selectedStepId}
              </span>
            </span>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => setSelectedStepId(null)}
              className="size-5 text-muted-foreground hover:text-foreground"
              aria-label="Deselect step"
            >
              <X className="size-3" />
            </Button>
          </div>
        )}
      </div>

      {/* Main Panel Content: Resizable split between Logs and Inspector */}
      <div className="min-h-0 flex-1">
        <ResizablePanelGroup orientation="horizontal" className="size-full">
          <ResizablePanel minSize="16rem">
            <div className="size-full overflow-y-auto">
              <LogsPanel
                runs={runs}
                selectedStepId={selectedStepId}
                onSelectStep={handleSelectStep}
              />
            </div>
          </ResizablePanel>

          {selectedStepData && (
            <>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize="20rem" minSize="16rem" maxSize="36rem">
                <InspectorPanel
                  step={selectedStepData.step}
                  run={selectedStepData.run}
                  onClose={() => setSelectedStepId(null)}
                />
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      </div>
    </div>
  )
}

export default ConsolePanel
