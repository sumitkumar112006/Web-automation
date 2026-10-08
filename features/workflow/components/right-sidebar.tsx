"use client"

import * as React from "react"
import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useReactFlow, useStore } from "@xyflow/react"
import { Loader2, MoreHorizontal, Play, Trash2 } from "lucide-react"
import { toast } from "sonner"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

import {
  nodeRegistry,
  type NodeDefinition,
  type NodeField,
  type NodeType,
  type StepNodeKind,
  type StepNodeType,
} from "@/features/workflow/nodes/node-registry"
import { useUpstreamConnections } from "@/features/workflow/hooks"
import { deleteWorkflowAction, runWorkflowAction } from "@/features/workflow/actions"
import { validateGraph } from "../lib/validate-graph"

// This file builds up to the RightSidebar component exported at the bottom: a
// header with workflow actions (delete, run), then two tabs — a Toolbar for
// adding nodes and an Editor for tweaking the selected node. Each helper below is
// defined just above the block that uses it.

// ---------------------------------------------------------------------------
// Shared pieces — used by both the Toolbar and the Editor.
// ---------------------------------------------------------------------------

// The accent-colored icon chip, mirroring the node on the canvas.
function NodeIcon({ type, className }: { type: NodeType; className?: string }) {
  const def = nodeRegistry[type]
  const Icon = def.icon
  return (
    <span
      className={cn(
        "flex size-6 shrink-0 items-center justify-center rounded-md",
        def.accent,
        className
      )}
    >
      <Icon className="size-3.5" />
    </span>
  )
}

// A titled, scrollable panel. Each tab renders its content inside one.
function Section({
  title,
  icon,
  children,
}: {
  title: string
  icon?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center gap-2 border-y border-border bg-card px-3 py-1.5 text-sm font-semibold">
        {icon}
        {title}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Editor tab — edits the fields of the selected node.
// ---------------------------------------------------------------------------

// A single editor field for a node property.
function Field({
  field,
  value,
  onChange,
  onFocus,
}: {
  field: NodeField
  value: string
  onChange: (value: string) => void
  onFocus?: () => void
}) {
  const Component = field.multiline ? Textarea : Input

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={field.key} className="text-xs">
        {field.label}
        {field.required && <span className="text-destructive">*</span>}
      </Label>
      <Component
        id={field.key}
        value={value}
        placeholder={field.placeholder}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
      />
    </div>
  )
}

// The Editor tab: one input per field on the selected node, or an empty state.
function Inspector({ node }: { node: StepNodeType | undefined }) {
  const { updateNodeData } = useReactFlow<StepNodeType>()
  const [lastFocusedField, setLastFocusedField] = useState<string | null>(null)
  const connections = useUpstreamConnections(node)

  if (!node) {
    return (
      <Section title="Editor">
        <p className="p-3 text-sm text-muted-foreground">No node selected</p>
      </Section>
    )
  }

  const { type, title, values } = node.data
  const def: NodeDefinition = nodeRegistry[type]

  const insertConnection = (item: { token: string; value?: string }) => {
    if (!def.fields || def.fields.length === 0) return
    const targetKey =
      lastFocusedField && def.fields.some((f) => f.key === lastFocusedField)
        ? lastFocusedField
        : def.fields[0].key

    const valueToInsert = item.value || item.token
    const currentVal = values[targetKey] ?? ""
    const newVal = currentVal ? `${currentVal} ${valueToInsert}` : valueToInsert

    updateNodeData(node.id, {
      values: { ...values, [targetKey]: newVal },
    })
  }

  return (
    <Section title={title} icon={<NodeIcon type={type} />}>
      <div className="flex flex-col gap-3 p-3">
        {def.fields.length === 0 ? (
          <p className="text-xs text-muted-foreground">No properties</p>
        ) : (
          def.fields.map((field: NodeField) => (
            <Field
              key={field.key}
              field={field}
              value={values[field.key] ?? ""}
              onFocus={() => setLastFocusedField(field.key)}
              onChange={(value) => {
                updateNodeData(node.id, {
                  values: { ...values, [field.key]: value },
                })
              }}
            />
          ))
        )}

        {connections.length > 0 && (
          <div className="flex flex-col gap-2 pt-2 border-t border-border">
            <Label className="text-xs font-medium text-muted-foreground">
              Connections
            </Label>
            <div className="flex flex-wrap gap-1.5">
              {connections.map((item) => (
                <button
                  key={item.token}
                  type="button"
                  onClick={() => insertConnection(item)}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/40 px-2 py-1 text-xs text-foreground transition-colors hover:bg-accent hover:text-accent-foreground cursor-pointer"
                  title={item.value ? `Value: ${item.value}` : `Insert ${item.token}`}
                >
                  <NodeIcon type={item.type} className="size-3.5 rounded-xs" />
                  <span className="truncate max-w-44 text-[11px] font-medium">
                    {item.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </Section>
  )
}

// ---------------------------------------------------------------------------
// Toolbar tab — adds nodes to the canvas, grouped by kind.
// ---------------------------------------------------------------------------

// The Toolbar's groups, one accordion section per node kind.
const sections: { kind: StepNodeKind; label: string }[] = [
  { kind: "trigger", label: "Triggers" },
  { kind: "action", label: "Actions" },
]

// Every node type from the registry, filtered into the groups below.
const definitions: NodeDefinition[] = Object.values(nodeRegistry)

// The Toolbar tab: a button per node type that adds it to the canvas.
function Palette() {
  const { screenToFlowPosition, setNodes, getNodes } = useReactFlow()

  const add = (type: NodeType) => {
    const def = nodeRegistry[type]
    const currentNodes = getNodes() as StepNodeType[]

    if (def.kind === "trigger") {
      const hasTrigger = currentNodes.some((node) => node.data?.kind === "trigger")
      if (hasTrigger) {
        toast.error("Only one trigger node is allowed per workflow")
        return
      }
    }

    const pane =
      document.querySelector(".react-flow__pane") ||
      document.querySelector(".react-flow")
    const bounds = pane?.getBoundingClientRect()
    const center = bounds
      ? {
          x: bounds.left + bounds.width / 2,
          y: bounds.top + bounds.height / 2,
        }
      : {
          x: window.innerWidth / 2,
          y: window.innerHeight / 2,
        }

    const flowPos = screenToFlowPosition(center)
    const position = {
      x: flowPos.x - 100,
      y: flowPos.y - 25,
    }

    const sameTypeCount = currentNodes.filter((node) => node.data?.type === type).length
    const title = sameTypeCount > 0 ? `${def.label} ${sameTypeCount + 1}` : def.label

    const newNode: StepNodeType = {
      id: crypto.randomUUID(),
      type: "step",
      position,
      data: {
        type: def.type as NodeType,
        kind: def.kind,
        title,
        values: {},
      },
    }

    setNodes((nds) => [...nds, newNode])
  }

  return (
    <Section title="Toolbar">
      <Accordion
        type="multiple"
        defaultValue={sections.map((s) => s.kind)}
        className="px-3 py-2"
      >
        {sections.map((section) => (
          <AccordionItem
            key={section.kind}
            value={section.kind}
            className="not-last:border-b-0"
          >
            <AccordionTrigger className="py-2 text-xs font-medium text-muted-foreground hover:no-underline">
              {section.label}
            </AccordionTrigger>
            <AccordionContent className="flex flex-col gap-0.5">
              {definitions
                .filter((def) => def.kind === section.kind)
                .map((def) => (
                  <Button
                    key={def.type}
                    variant="ghost"
                    onClick={() => add(def.type as NodeType)}
                    className="justify-start gap-2.5 px-1.5 text-xs"
                  >
                    <NodeIcon type={def.type as NodeType} />
                    {def.label}
                  </Button>
                ))}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </Section>
  )
}

// ---------------------------------------------------------------------------
// Header — workflow-level actions shown above the tabs.
// ---------------------------------------------------------------------------

// The "..." menu for workflow-level actions.
function ActionsMenu({ workflowId }: { workflowId: string }) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [open, setOpen] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    const toastId = toast.loading("Deleting workflow...")

    try {
      const res = await deleteWorkflowAction(workflowId)
      if (res?.success) {
        toast.success("Workflow deleted successfully", { id: toastId })
        setOpen(false)
        router.push("/")
        router.refresh()
      } else {
        throw new Error("Failed to delete workflow")
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete workflow", {
        id: toastId,
      })
      setIsDeleting(false)
    }
  }

  return (
    <DropdownMenu open={open} onOpenChange={(val) => !isDeleting && setOpen(val)}>
      <DropdownMenuTrigger asChild>
        <Button size="icon" variant="ghost" disabled={isDeleting} aria-label="Workflow options">
          {isDeleting ? (
            <Loader2 className="size-4 animate-spin text-destructive" />
          ) : (
            <MoreHorizontal className="size-4" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-48">
        <DropdownMenuItem
          variant="destructive"
          disabled={isDeleting}
          className="text-xs [&_svg:not([class*='size-'])]:size-3.5 cursor-pointer flex items-center gap-2"
          onSelect={(e) => {
            e.preventDefault()
            handleDelete()
          }}
        >
          {isDeleting ? (
            <>
              <Loader2 className="size-3.5 animate-spin" />
              <span>Deleting workflow...</span>
            </>
          ) : (
            <>
              <Trash2 className="size-3.5" />
              <span>Delete workflow</span>
            </>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Kicks off a run of the current workflow.
function RunButton({ workflowId }: { workflowId: string }) {
  const { getNodes, getEdges } = useReactFlow<StepNodeType>()
  const [isPending, startTransition] = useTransition()

  return (
    <Button
      size="sm"
      variant="secondary"
      disabled={isPending}
      onClick={() => {
        const graph = { nodes: getNodes(), edges: getEdges() }
        const problems = validateGraph(graph)
        if (problems.length > 0) {
          toast.error(problems[0])
          return
        }

        startTransition(async () => {
          try {
            await runWorkflowAction({
              id: workflowId,
              graph,
            })
            toast.success("Workflow run started")
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to run workflow")
          }
        })
      }}
    >
      {isPending ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : (
        <Play className="size-3.5 fill-primary" />
      )}
      Run
    </Button>
  )
}

// ---------------------------------------------------------------------------
// The sidebar itself — header on top, then the Toolbar / Editor tabs.
// ---------------------------------------------------------------------------

export function RightSidebar({ workflowId }: { workflowId: string }) {
  const [tab, setTab] = useState("toolbar")

  // TODO: read the currently selected node from React Flow.
  const selected = useStore((state) => state.nodes.find(n => n.selected)) as StepNodeType || undefined

  // TODO: auto-switch to the Editor tab when the selection changes.
  const [prevSelectId, setPrevSelectId] = useState(selected?.id)

  if(selected && selected.id != prevSelectId){
    setPrevSelectId(selected.id)
    setTab("editor")
  }

  return (
    <div className="flex size-full flex-col bg-background">
      <Tabs value={tab} onValueChange={setTab} className="flex size-full flex-col gap-0">
        <div className="flex items-center justify-between border-b border-border p-2">
          <ActionsMenu workflowId={workflowId} />
          <RunButton workflowId={workflowId} />
        </div>
        <TabsList className="m-2 w-fit bg-background">
          <TabsTrigger
            value="toolbar"
            className="flex-none rounded-sm data-active:bg-accent! data-active:text-accent-foreground! data-active:shadow-none! dark:data-active:border-transparent!"
          >
            Toolbar
          </TabsTrigger>
          <TabsTrigger
            value="editor"
            className="flex-none rounded-sm data-active:bg-accent! data-active:text-accent-foreground! data-active:shadow-none! dark:data-active:border-transparent!"
          >
            Editor
          </TabsTrigger>
        </TabsList>
        <TabsContent value="toolbar" className="flex min-h-0 flex-1 flex-col mt-0 data-[state=inactive]:hidden">
          <Palette />
        </TabsContent>
        <TabsContent value="editor" className="flex min-h-0 flex-1 flex-col mt-0 data-[state=inactive]:hidden">
          <Inspector node={selected} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
