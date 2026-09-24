import { pgTable, text, timestamp, uuid, jsonb, integer } from "drizzle-orm/pg-core"

export const workflows = pgTable("workflows", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: text("org_id").notNull(),
  name: text("name").notNull(),
  graph: jsonb("graph"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

export const executions = pgTable("executions", {
  id: uuid("id").defaultRandom().primaryKey(),
  workflowId: uuid("workflow_id")
    .notNull()
    .references(() => workflows.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(),
  status: text("status")
    .$type<"pending" | "running" | "completed" | "failed" | "cancelled">()
    .default("pending")
    .notNull(),
  logs: jsonb("logs").$type<Array<{ timestamp: string; level: string; message: string }>>().default([]),
  result: jsonb("result").$type<Record<string, unknown>>(),
  error: text("error"),
  duration: integer("duration"), // in milliseconds
  startedAt: timestamp("started_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
})

export const credentials = pgTable("credentials", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  value: text("value").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
})

// Type definitions
export type Workflow = typeof workflows.$inferSelect
export type NewWorkflow = typeof workflows.$inferInsert

export type Execution = typeof executions.$inferSelect
export type NewExecution = typeof executions.$inferInsert

export type Credential = typeof credentials.$inferSelect
export type NewCredential = typeof credentials.$inferInsert
