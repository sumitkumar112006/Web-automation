"use client"

import { toast } from "sonner"
import { Button } from "@/components/ui/button"

export default function Page() {
  return (
    <div className="flex min-h-svh p-6">
      <div className="flex max-w-md min-w-0 flex-col gap-4 text-sm leading-loose">
        <div>
          <h1 className="font-medium text-base">Project ready!</h1>
          <p>You may now add components and start building.</p>
          <p>We&apos;ve already added the button component for you.</p>
          <div className="flex flex-wrap gap-2 mt-4">
            <Button
              onClick={() =>
                toast("Event has been created", {
                  description: "Sunday, December 03, 2023 at 9:00 AM",
                  action: {
                    label: "Undo",
                    onClick: () => console.log("Undo"),
                  },
                })
              }
            >
              Show Toast
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                toast.success("Changes saved successfully!")
              }
            >
              Success Toast
            </Button>
            <Button variant="secondary" asChild>
              <a href="/test">Go to Protected Test Page (/test)</a>
            </Button>
          </div>
        </div>
        <div className="font-mono text-xs text-muted-foreground">
          (Press <kbd>d</kbd> to toggle dark mode)
        </div>
      </div>
    </div>
  )
}
