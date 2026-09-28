"use client"

import { ReactNode } from "react"
import {
  LiveblocksProvider,
  RoomProvider,
  ClientSideSuspense,
} from "@liveblocks/react/suspense"

interface RoomProps {
  children: ReactNode
  roomId: string
  fallback?: ReactNode
}

// features/workflow/components/room.tsx
export function Room({ children, roomId, fallback }: RoomProps) {
    return (
        <LiveblocksProvider throttle={16} publicApiKey={process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY!}>
            <RoomProvider id={roomId}>
                <ClientSideSuspense fallback={fallback ?? null}>
                    {children}
                </ClientSideSuspense>
            </RoomProvider>
        </LiveblocksProvider>
    )
}

