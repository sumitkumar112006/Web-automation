import { AppSidebar } from "@/components/app-sidebar"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="min-w-0 flex-1 overflow-x-hidden">
        {/* Mobile Header with Sidebar Trigger */}
        <header className="flex h-12 shrink-0 items-center justify-between border-b border-border/60 bg-background/95 px-3 backdrop-blur-xs md:hidden">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="size-8" />
            <span className="font-semibold text-sm">Web Automation</span>
          </div>
        </header>
        <div className="flex flex-1 flex-col overflow-y-auto">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
