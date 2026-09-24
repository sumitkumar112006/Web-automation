"use client"

import * as React from "react"
import Link from "next/link"
import { useParams, usePathname } from "next/navigation"
import { Plus, Workflow as WorkflowIcon } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { createWorkflowAction } from "@/features/workflow/actions"
import { generateSlug } from "@/features/workflow/lib"
import type { Workflow } from "@/lib/db/schema"

interface WorkflowNavProps {
  workflows?: Workflow[]
}

export function WorkflowNav({ workflows = [] }: WorkflowNavProps) {
  const params = useParams()
  const pathname = usePathname()
  const currentId = params?.id as string | undefined
  const [isPending, startTransition] = React.useTransition()

  const handleCreate = () => {
    startTransition(async () => {
      const slug = generateSlug()
      await createWorkflowAction(slug)
    })
  }

  return (
    <SidebarContent>
      {/* Expanded View */}
      <SidebarGroup className="group-data-[collapsible=icon]:hidden">
        <SidebarGroupLabel className="text-xs font-medium text-sidebar-foreground/70">
          Workflows
        </SidebarGroupLabel>
        <SidebarGroupAction
          title="Create workflow"
          onClick={handleCreate}
          disabled={isPending}
        >
          <Plus className="size-4" />
          <span className="sr-only">Create workflow</span>
        </SidebarGroupAction>
        <SidebarGroupContent>
          <SidebarMenu>
            {workflows.length === 0 ? (
              <div className="px-2 py-3 text-xs text-muted-foreground">
                No workflows yet. Click + to create one.
              </div>
            ) : (
              workflows.map((wf) => {
                const isActive = pathname === `/workflow/${wf.id}` || currentId === wf.id

                return (
                  <SidebarMenuItem key={wf.id}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className="h-9 px-2.5 text-sm"
                    >
                      <Link href={`/workflow/${wf.id}`}>
                        <span className="truncate">{wf.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })
            )}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      {/* Collapsed Icon View */}
      <SidebarGroup className="hidden group-data-[collapsible=icon]:block">
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton tooltip="Workflows">
                    <WorkflowIcon />
                    <span>Workflows</span>
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  side="right"
                  align="start"
                  className="w-56 p-1.5"
                >
                  <DropdownMenuItem
                    onClick={handleCreate}
                    disabled={isPending}
                    className="gap-2 font-medium cursor-pointer"
                  >
                    <Plus className="size-4" />
                    <span>New workflow</span>
                  </DropdownMenuItem>
                  {workflows.length > 0 && <DropdownMenuSeparator />}
                  {workflows.map((wf) => (
                    <DropdownMenuItem
                      key={wf.id}
                      asChild
                      className="cursor-pointer"
                    >
                      <Link href={`/workflow/${wf.id}`}>
                        <span className="truncate">{wf.name}</span>
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>
  )
}
