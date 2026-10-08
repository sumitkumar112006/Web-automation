"use client"

import * as React from "react"
import { createContext, useContext, useMemo } from "react"
import { useRealtimeRunsWithTag } from "@trigger.dev/react-hooks"
import type { runWorkflowTask, RunStep } from "@/features/workflow/tasks/run-workflow"

interface WorkflowRunsContextValue {
  runs: ReturnType<typeof useRealtimeRunsWithTag<typeof runWorkflowTask>>["runs"]
  error: Error | undefined
  latestRun:
    | ReturnType<typeof useRealtimeRunsWithTag<typeof runWorkflowTask>>["runs"][number]
    | undefined
  steps: RunStep[]
  isLive: boolean
}

const WorkflowRunsContext = createContext<WorkflowRunsContextValue | null>(null)

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
  const { runs, error } = useRealtimeRunsWithTag<typeof runWorkflowTask>(
    `workflow:${workflowId}`,
    {
      accessToken,
      enabled: Boolean(workflowId && accessToken),
    }
  )

  const latestRun = useMemo(() => {
    if (!runs || runs.length === 0) return undefined
    return [...runs].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0]
  }, [runs])

  const { steps, isLive } = useMemo(() => {
    if (!latestRun) {
      return { steps: [], isLive: false }
    }

    const live =
      latestRun.status === "QUEUED" ||
      latestRun.status === "EXECUTING" ||
      latestRun.status === "DEQUEUED" ||
      latestRun.status === "WAITING" ||
      latestRun.status === "DELAYED"

    const outputSteps = (latestRun.output as { steps?: RunStep[] } | undefined)
      ?.steps
    const metadataSteps = (latestRun.metadata as { steps?: RunStep[] } | undefined)
      ?.steps
    const resolvedSteps: RunStep[] = outputSteps ?? metadataSteps ?? []

    return {
      steps: resolvedSteps,
      isLive: live,
    }
  }, [latestRun])

  const value = useMemo(
    () => ({
      runs,
      error,
      latestRun,
      steps,
      isLive,
    }),
    [runs, error, latestRun, steps, isLive]
  )

  return (
    <WorkflowRunsContext.Provider value={value}>
      {children}
    </WorkflowRunsContext.Provider>
  )
}

/**
 * Returns the most recent run's steps plus whether it's still live (queued or executing).
 * Prefers the run's final output steps and falls back to live metadata steps.
 */
export function useLatestRunSteps(): {
  steps: RunStep[]
  isLive: boolean
  latestRun:
    | ReturnType<typeof useRealtimeRunsWithTag<typeof runWorkflowTask>>["runs"][number]
    | undefined
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
