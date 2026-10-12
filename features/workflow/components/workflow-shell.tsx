"use client"

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { Canvas } from "./canvas"
import { RightSidebar } from "./right-sidebar"
import { ConsolePanel } from "./console-panel"

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
              <Canvas workflowId={workflowId} />
            </ResizablePanel>

            <ResizableHandle withHandle />

            {/* Bottom Panel: Console Panel */}
            <ResizablePanel defaultSize="12rem" minSize="6rem">
              <ConsolePanel workflowId={workflowId} />
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Right Panel: Inspector */}
        <ResizablePanel defaultSize="16rem" minSize="14rem" maxSize="36rem">
          <RightSidebar workflowId={workflowId} />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}
