import * as React from "react"
import { OrganizationSwitcher, UserButton } from "@clerk/nextjs"
import { auth } from "@clerk/nextjs/server"

import {
  Sidebar,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { WorkflowNav } from "@/features/workflow/components/workflow-nav"
import { listWorkflows } from "@/features/workflow/data"

export async function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { orgId } = await auth()
  const workflows = orgId ? await listWorkflows(orgId) : []

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

      <WorkflowNav workflows={workflows} />

      <SidebarFooter className="p-3">
        <div className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
          <UserButton />
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
