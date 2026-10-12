import { task } from "@trigger.dev/sdk"

export const sentryErrorTest = task({
  id: "sentry-error-test",
  retry: {
    // Only retry once so it fails immediately and reports to Sentry
    maxAttempts: 1,
  },
  run: async () => {
    const error = new Error("This is a custom test error that Sentry will capture from Trigger.dev")
    error.cause = { additionalContext: "Trigger.dev Sentry integration test" }
    throw error
  },
})
