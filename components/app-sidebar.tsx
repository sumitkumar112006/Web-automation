"use client"

import * as React from "react"
import { OrganizationSwitcher, UserButton } from "@clerk/nextjs"
import { Plus, Workflow } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar"

const WORKFLOWS = [
  { id: "dominant-wasp", title: "dominant-wasp" },
  { id: "honest-reindeer", title: "honest-reindeer" },
  { id: "expected-llama", title: "expected-llama" },
  { id: "essential-ocelot", title: "essential-ocelot" },
  { id: "creepy-echidna", title: "creepy-echidna" },
  { id: "eastern-silkworm", title: "eastern-silkworm" },
  { id: "cultural-lion", title: "cultural-lion" },
  { id: "proud-weasel", title: "proud-weasel" },
  { id: "regional-bonobo", title: "regional-bonobo" },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [activeWorkflow, setActiveWorkflow] = React.useState("dominant-wasp")

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="p-3">
        <div className="flex items-center justify-between gap-2 group-data-[collapsible=icon]:justify-center">
          <div className="flex items-center gap-2 overflow-hidden group-data-[collapsible=icon]:hidden flex-1 min-w-0">
            <OrganizationSwitcher
              hidePersonal={false}
              afterCreateOrganizationUrl="/"
              afterSelectOrganizationUrl="/"
              afterLeaveOrganizationUrl="/choose-organization"
              appearance={{
                elements: {
                  rootBox: "w-full max-w-full overflow-hidden",
                  organizationSwitcherTrigger: "w-full justify-between truncate",
                },
              }}
            />
          </div>
          <SidebarTrigger className="shrink-0" />
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Expanded View */}
        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
          <SidebarGroupLabel className="text-xs font-medium text-sidebar-foreground/70">
            Workflows
          </SidebarGroupLabel>
          <SidebarGroupAction title="Create workflow">
            <Plus />
            <span className="sr-only">Create workflow</span>
          </SidebarGroupAction>
          <SidebarGroupContent>
            <SidebarMenu>
              {WORKFLOWS.map((wf) => (
                <SidebarMenuItem key={wf.id}>
                  <SidebarMenuButton
                    isActive={activeWorkflow === wf.id}
                    onClick={() => setActiveWorkflow(wf.id)}
                    className="h-9 px-2.5 text-sm"
                  >
                    <span className="truncate">{wf.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
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
                      <Workflow />
                      <span>Workflows</span>
                    </SidebarMenuButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    side="right"
                    align="start"
                    className="w-56 p-1.5"
                  >
                    <DropdownMenuItem className="gap-2 font-medium cursor-pointer">
                      <Plus className="size-4" />
                      <span>New workflow</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {WORKFLOWS.map((wf) => (
                      <DropdownMenuItem
                        key={wf.id}
                        onClick={() => setActiveWorkflow(wf.id)}
                        className="cursor-pointer"
                      >
                        {wf.title}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3">
        <div className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
          <UserButton />
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
