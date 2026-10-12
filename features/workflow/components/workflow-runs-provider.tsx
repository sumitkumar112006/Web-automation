"use client"

import * as React from "react"
import { createContext, useContext, useMemo } from "react"
import { useRealtimeRunsWithTag } from "@trigger.dev/react-hooks"
import type { runWorkflowTask, RunStep } from "@/features/workflow/tasks/run-workflow"

export type { RunStep }

export type RawRealtimeRun = ReturnType<
  typeof useRealtimeRunsWithTag<typeof runWorkflowTask>
>["runs"][number]

export type WorkflowRun = RawRealtimeRun & {
  steps: RunStep[]
  isLive: boolean
}

export function isRunLive(status?: string): boolean {
  if (!status) return false
  return (
    status === "QUEUED" ||
    status === "EXECUTING" ||
    status === "DEQUEUED" ||
    status === "WAITING" ||
    status === "DELAYED"
  )
}

export function getRunSteps(
  run?: { output?: unknown; metadata?: unknown } | null
): RunStep[] {
  if (!run) return []
  const outputSteps = (run.output as { steps?: RunStep[] } | undefined)?.steps
  const metadataSteps = (run.metadata as { steps?: RunStep[] } | undefined)?.steps
  return outputSteps ?? metadataSteps ?? []
}

export interface WorkflowRunsContextValue {
  /**
   * All runs for this workflow sorted newest-first, each enriched with resolved `steps` and `isLive`.
   */
  runs: WorkflowRun[]
  /**
   * The raw, unenriched runs array from the realtime subscription.
   */
  rawRuns: RawRealtimeRun[]
  error: Error | undefined
  /**
   * The most recent run, or undefined if no runs exist yet.
   */
  latestRun: WorkflowRun | undefined
  /**
   * The steps for the latest run.
   */
  steps: RunStep[]
  /**
   * Whether the latest run is currently active/running.
   */
  isLive: boolean
  /**
   * Utility helper to extract steps from any run payload or metadata.
   */
  getRunSteps: (run?: { output?: unknown; metadata?: unknown } | null) => RunStep[]
}

export const WorkflowRunsContext = createContext<WorkflowRunsContextValue | null>(null)

interface WorkflowRunsProviderProps {
  workflowId: string
  accessToken: string
  children: React.ReactNode
}

/**
 * Shared client provider that subscribes to this workflow's runs in realtime by tag `workflow:<id>`.
 */
export function WorkflowRunsProvider({
  workflowId,
  accessToken,
  children,
}: WorkflowRunsProviderProps) {
  const { runs: rawRuns, error } = useRealtimeRunsWithTag<typeof runWorkflowTask>(
    `workflow:${workflowId}`,
    {
      accessToken,
      enabled: Boolean(workflowId && accessToken),
    }
  )

  const runs: WorkflowRun[] = useMemo(() => {
    if (!rawRuns || rawRuns.length === 0) return []
    return [...rawRuns]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .map((run) => {
        const steps = getRunSteps(run)
        const isLive = isRunLive(run.status)

        return {
          ...run,
          steps,
          isLive,
        }
      })
  }, [rawRuns])

  const latestRun = runs[0]
  const steps = latestRun?.steps ?? []
  const isLive = latestRun?.isLive ?? false

  const value = useMemo(
    () => ({
      runs,
      rawRuns: rawRuns ?? [],
      error,
      latestRun,
      steps,
      isLive,
      getRunSteps,
    }),
    [runs, rawRuns, error, latestRun, steps, isLive]
  )

  return (
    <WorkflowRunsContext.Provider value={value}>
      {children}
    </WorkflowRunsContext.Provider>
  )
}

/**
 * Reads all runs for this workflow, their steps, and run status.
 */
export function useWorkflowRuns(): WorkflowRunsContextValue {
  const context = useContext(WorkflowRunsContext)
  if (!context) {
    throw new Error("useWorkflowRuns must be used within a WorkflowRunsProvider")
  }
  return context
}

/**
 * Reads workflow runs if inside provider, or returns null if outside.
 */
export function useWorkflowRunsSafe(): WorkflowRunsContextValue | null {
  return useContext(WorkflowRunsContext)
}

/**
 * Select a specific run by ID and access its resolved steps.
 */
export function useWorkflowRun(runId?: string): WorkflowRun | undefined {
  const { runs } = useWorkflowRuns()
  return useMemo(() => {
    if (!runId) return undefined
    return runs.find((r) => r.id === runId)
  }, [runs, runId])
}

/**
 * Returns the most recent run's steps plus whether it's still live (queued or executing).
 * Prefers the run's final output steps and falls back to live metadata steps.
 */
export function useLatestRunSteps(): {
  steps: RunStep[]
  isLive: boolean
  latestRun: WorkflowRun | undefined
  error: Error | undefined
} {
  const context = useContext(WorkflowRunsContext)
  if (!context) {
    throw new Error(
      "useLatestRunSteps must be used within a WorkflowRunsProvider"
    )
  }
  return {
    steps: context.steps,
    isLive: context.isLive,
    latestRun: context.latestRun,
    error: context.error,
  }
}
