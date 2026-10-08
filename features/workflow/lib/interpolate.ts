/**
 * Safely resolves a dot/bracket path (e.g. "nodeId.items[0].name") against an object.
 */
function getByPath(obj: unknown, path: string): unknown {
  if (obj == null || typeof obj !== "object") return undefined

  const keys = path
    .replace(/\[(\d+)\]/g, ".$1")
    .replace(/\[['"](.*?)['"]\]/g, ".$1")
    .split(".")
    .map((k) => k.trim())
    .filter(Boolean)

  let current: any = obj
  for (const key of keys) {
    if (current == null || typeof current !== "object") {
      return undefined
    }
    current = current[key]
  }

  return current
}

/**
 * Replaces placeholders like `{{ someNodeId.title }}` or `{{ someNodeId.items[0].name }}`
 * inside a field's text with the corresponding value from node outputs.
 *
 * - If a placeholder resolves to `null` or `undefined`, it is replaced with `""`.
 * - If it resolves to an object/array, it is replaced with its JSON string.
 * - Otherwise, it is converted to its string representation.
 */
export function interpolate(
  text: string,
  outputs: Record<string, unknown>
): string {
  if (!text) return ""

  return text.replace(/\{\{\s*([^}]+)\s*\}\}/g, (_, expression: string) => {
    const value = getByPath(outputs, expression.trim())

    if (value === undefined || value === null) {
      return ""
    }

    if (typeof value === "object") {
      return JSON.stringify(value)
    }

    return String(value)
  })
}
