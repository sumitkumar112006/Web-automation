import { tasks } from "@trigger.dev/sdk"
import * as Sentry from "@sentry/node"

// Initialize Sentry in Trigger.dev task environment
Sentry.init({
  defaultIntegrations: false,
  // The Data Source Name (DSN) is a unique identifier for your Sentry project.
  dsn: process.env.SENTRY_DSN,
  // Match environment
  environment: process.env.NODE_ENV === "production" ? "production" : "development",
})

// Register a global onFailure hook to capture task errors in Sentry
tasks.onFailure(({ payload, error, ctx }) => {
  Sentry.captureException(error, {
    extra: {
      payload,
      ctx,
    },
  })
})
