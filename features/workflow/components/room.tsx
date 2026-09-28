"use client"

import { ReactNode } from "react"
import {
  LiveblocksProvider,
  RoomProvider,
  ClientSideSuspense,
} from "@liveblocks/react/suspense"
import { Spinner } from "@/components/ui/spinner"

interface RoomProps {
  children: ReactNode
  roomId: string
  fallback?: ReactNode
}

// features/workflow/components/room.tsx
export function Room({ children, roomId, fallback }: RoomProps) {
    return (
        <LiveblocksProvider throttle={16} authEndpoint="/api/liveblocks/auth">
            <RoomProvider id={roomId}>
                <ClientSideSuspense
                    fallback={
                        fallback ?? (
                            <div className="flex min-h-svh items-center justify-center">
                                <Spinner className="size-6 text-muted-foreground" />
                            </div>
                        )
                    }
                >
                    {children}
                </ClientSideSuspense>
            </RoomProvider>
        </LiveblocksProvider>
    )
}

