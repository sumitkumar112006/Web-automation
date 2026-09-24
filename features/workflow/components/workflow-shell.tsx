"use client"

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"

interface WorkflowShellProps {
  workflowId: string
}

export function WorkflowShell({ workflowId }: WorkflowShellProps) {
  return (
    <div className="size-full flex-1 overflow-hidden">
      <ResizablePanelGroup orientation="horizontal" className="size-full">
        {/* Left Panel: Primary Column */}
        <ResizablePanel minSize="30rem">
          <ResizablePanelGroup orientation="vertical" className="size-full">
            {/* Top Panel: Canvas Placeholder */}
            <ResizablePanel minSize="18rem">
              <div className="flex size-full items-center justify-center bg-background/50 p-4 text-sm font-medium text-muted-foreground">
                Canvas ({workflowId})
              </div>
            </ResizablePanel>

            <ResizableHandle withHandle />

            {/* Bottom Panel: Logs Placeholder */}
            <ResizablePanel defaultSize="8rem" minSize="6rem">
              <div className="flex size-full items-center justify-center bg-muted/20 p-4 text-sm font-medium text-muted-foreground">
                Logs
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Right Panel: Inspector */}
        <ResizablePanel defaultSize="16rem" minSize="14rem" maxSize="36rem">
          <div className="flex size-full items-center justify-center bg-muted/10 p-4 text-sm font-medium text-muted-foreground">
            Inspector
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}
