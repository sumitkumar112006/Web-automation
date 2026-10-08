import { defineConfig } from "@trigger.dev/sdk"
import { additionalFiles } from "@trigger.dev/build/extensions/core"

export default defineConfig({
  project: "proj_bdyeeuxdresnszikvadu",
  runtime: "node",
  logLevel: "log",
  maxDuration: 300,
  retries: {
    enabledInDev: true,
    default: {
      maxAttempts: 3,
      minTimeoutInMs: 1000,
      maxTimeoutInMs: 10000,
      factor: 2,
      randomize: true,
    },
  },
  dirs: ["features/workflow/tasks"],
  build: {
    extensions: [
      additionalFiles({
        files: [
          "features/workflow/dist/**",
          "node_modules/@browserbasehq/stagehand/dist/assets/**",
          "node_modules/@browserbasehq/stagehand/dist/extension/**",
        ],
      }),
    ],
  },
})

