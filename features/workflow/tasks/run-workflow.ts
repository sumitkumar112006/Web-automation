import path from "node:path"
import fs from "node:fs"
import toposort from "toposort"
import { logger, metadata, task } from "@trigger.dev/sdk"
import { getWorkflow } from "@/features/workflow/data"
import { browserbase, Stagehand } from "@browserbasehq/stagehand"
import { nodeExecutors } from "@/features/workflow/nodes/node-executors"
import { interpolate } from "@/features/workflow/lib"

export type RunStep = {
  id: string
  status: "pending" | "running" | "done" | "failed"
}

// Ensure Stagehand finds the extension assets even when bundled by Trigger.dev
const defaultExtensionZip = path.resolve(
  process.cwd(),
  "node_modules/@browserbasehq/stagehand/dist/assets/stagehand-extension.zip"
)
if (!process.env.STAGEHAND_EXTENSION_ARCHIVE_PATH && fs.existsSync(defaultExtensionZip)) {
  process.env.STAGEHAND_EXTENSION_ARCHIVE_PATH = defaultExtensionZip
}

const defaultExtensionDir = path.resolve(
  process.cwd(),
  "node_modules/@browserbasehq/stagehand/dist/extension"
)
if (!process.env.STAGEHAND_EXTENSION_DIRECTORY_PATH && fs.existsSync(defaultExtensionDir)) {
  process.env.STAGEHAND_EXTENSION_DIRECTORY_PATH = defaultExtensionDir
}

export const runWorkflowTask = task({
  id: "run-workflow",
  run: async ({ workflowId, orgId }: { workflowId: string; orgId: string }) => {
    const workflow = await getWorkflow(orgId, workflowId)
    if (!workflow || !workflow.graph) {
      throw new Error(`Workflow ${workflowId} not found or has no graph`)
    }

    const { nodes, edges } = workflow.graph
    const byId = new Map(nodes.map((n) => [n.id, n]))

    // Run only connected nodes - anything touching an edge. Orphans dropped on
    // the canvas are skipped. toposort orders them and throws on a cycle.
    const connected = new Set(edges.flatMap((e) => [e.source, e.target]))
    const order = toposort
      .array(
        nodes.map((n) => n.id),
        edges.map((e) => [e.source, e.target])
      )
      .filter((id) => connected.has(id))

    logger.log(`Running workflow ${workflow.name}`, { steps: order.length })

    // The run owns one Browserbase session, opened lazily on the first browser step
    // and reused by every later one, so the recording spans the whole flow. The
    // LLM routes through Browserbase's Model Gateway (BROWSERBASE_API_KEY), so no
    // separate provider key is needed.
    let stagehand: Stagehand | undefined
    let browser: Awaited<ReturnType<typeof browserbase.launch>> | undefined

    const getStagehand = async () => {
      if (!stagehand) {
        const apiKey = process.env.BROWSERBASE_API_KEY
        if (!apiKey) {
          throw new Error("BROWSERBASE_API_KEY is not set in environment variables")
        }

        const groqApiKey = process.env.GROQ_API_KEY
        const openaiApiKey = process.env.OPENAI_API_KEY

        const modelConfig = groqApiKey
          ? {
              modelName: "groq/openai/gpt-oss-120b" as const,
              apiKey: groqApiKey,
            }
          : openaiApiKey
          ? {
              modelName: "openai/gpt-4.1" as const,
              apiKey: openaiApiKey,
            }
          : null

        if (!modelConfig) {
          throw new Error(
            "GROQ_API_KEY is not set in environment variables (.env.local)"
          )
        }

        if (!process.env.STAGEHAND_EXTENSION_ARCHIVE_PATH && fs.existsSync(defaultExtensionZip)) {
          process.env.STAGEHAND_EXTENSION_ARCHIVE_PATH = defaultExtensionZip
        }

        browser = await browserbase.launch({ apiKey })
        stagehand = await Stagehand.create({
          browser,
          model: modelConfig,
          // Pino's logging backend spawns a thread-stream worker (lib/worker.js)
          // that can't be resolved inside trigger.dev's bundled output. Disable it -
          // the option exists for exactly these minimal/bundled environments.
          logging: { level: "info", format: "pretty" },
        })
      }
      return stagehand
    }

    const outputs: Record<string, unknown> = {}

    // Initialize and publish initial step list under metadata "steps"
    const steps: RunStep[] = order.map((id) => ({ id, status: "pending" }))
    metadata.set("steps", steps)

    try {
      for (const id of order) {
        const node = byId.get(id)!
        const step = steps.find((s) => s.id === id)!

        step.status = "running"
        metadata.set("steps", steps)
        await metadata.flush()

        logger.log(`Running step: ${node.data.title}`)

        const values = Object.fromEntries(
          Object.entries(node.data.values || {}).map(([key, value]) => [
            key,
            interpolate(value, outputs),
          ])
        )

        try {
          const executor = nodeExecutors[node.data.type]
          if (executor) {
            const result = await executor({
              values,
              getStagehand,
            })
            outputs[id] = result
          }
          step.status = "done"
          metadata.set("steps", steps)
        } catch (err) {
          step.status = "failed"
          metadata.set("steps", steps)
          await metadata.flush()
          throw err
        }
      }
    } finally {
      await stagehand?.close()
      await browser?.close()
    }

    return { steps }
  },
})