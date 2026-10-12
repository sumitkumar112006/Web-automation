"use client"

import * as React from "react"
import { useCallback, useEffect, useRef, useState } from "react"
import Hls from "hls.js"
import { AlertCircle, Loader2, RotateCcw } from "lucide-react"

import { Button } from "@/components/ui/button"
import * as Sentry from "@sentry/nextjs"
import { cn } from "@/lib/utils"

export interface SessionReplayProps {
  sessionId: string
  className?: string
  autoPlay?: boolean
  muted?: boolean
  controls?: boolean
}

export function SessionReplay({
  sessionId,
  className,
  autoPlay = true,
  muted = true,
  controls = true,
}: SessionReplayProps) {
  const [status, setStatus] = useState<"polling" | "ready" | "error">("polling")
  const [error, setError] = useState<string | null>(null)
  const [retryKey, setRetryKey] = useState(0)

  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<Hls | null>(null)

  // 1. Poll the replay route until the playlist is ready
  useEffect(() => {
    let isCancelled = false
    let timeoutId: NodeJS.Timeout | null = null

    const checkReplayStatus = async () => {
      try {
        const res = await fetch(`/api/replays/${encodeURIComponent(sessionId)}`, {
          method: "GET",
          cache: "no-store",
          headers: {
            Accept: "application/vnd.apple.mpegurl, text/plain",
          },
        })

        if (isCancelled) return

        if (res.ok) {
          // Playlist is ready!
          setStatus("ready")
          return
        }

        if (res.status === 401) {
          setError("Unauthorized to view this session replay.")
          setStatus("error")
          return
        }

        if (res.status === 403) {
          setError("Pro plan required to view session recordings.")
          setStatus("error")
          return
        }

        // Replay not ready yet (Browserbase status e.g. 404 / 422) - poll again in 2.5s
        timeoutId = setTimeout(checkReplayStatus, 2500)
      } catch {
        if (isCancelled) return
        // Network or fetch failure - retry after 3s
        timeoutId = setTimeout(checkReplayStatus, 3000)
      }
    }

    checkReplayStatus()

    return () => {
      isCancelled = true
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [sessionId, retryKey])

  const isReady = status === "ready"

  // 2. Play the HLS stream once ready
  useEffect(() => {
    if (!isReady || !videoRef.current) return

    const video = videoRef.current
    const playlistUrl = `/api/replays/${encodeURIComponent(sessionId)}`

    // Clean up any existing Hls instance
    if (hlsRef.current) {
      hlsRef.current.destroy()
      hlsRef.current = null
    }

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
      })

      hlsRef.current = hls
      hls.loadSource(playlistUrl)
      hls.attachMedia(video)

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (autoPlay) {
          video.play().catch(() => {
            // Autoplay may be blocked by browser policy if unmuted
          })
        }
      })

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          Sentry.addBreadcrumb({
            category: "session-replay",
            message: "Fatal HLS player error encountered",
            data: { errorType: data.type, details: data.details, sessionId },
            level: "warning",
          })

          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls.startLoad()
              break
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError()
              break
            default:
              hls.destroy()
              Sentry.captureMessage("Failed to play session recording due to unrecoverable HLS error", {
                level: "warning",
                extra: { sessionId, errorType: data.type, details: data.details },
              })
              setError("Failed to play session recording.")
              break
          }
        }
      })

      return () => {
        hls.destroy()
        hlsRef.current = null
      }
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // Safari and native HLS fallback
      video.src = playlistUrl
      if (autoPlay) {
        const handleLoadedMetadata = () => {
          video.play().catch(() => {})
        }
        video.addEventListener("loadedmetadata", handleLoadedMetadata, { once: true })
      }
    } else {
      setError("HLS playback is not supported on this browser.")
    }
  }, [isReady, sessionId, autoPlay])

  const handleRetry = useCallback(() => {
    setStatus("polling")
    setError(null)
    setRetryKey((k) => k + 1)
  }, [])

  return (
    <div
      className={cn(
        "relative flex aspect-video w-full flex-col items-center justify-center overflow-hidden rounded-lg border border-border bg-black text-white shadow-xs",
        className
      )}
    >
      {/* Loading & Polling State */}
      {status === "polling" && !error && (
        <div className="flex flex-col items-center justify-center gap-3 p-6 text-center">
          <div className="flex size-10 items-center justify-center rounded-full bg-blue-500/10 text-blue-400">
            <Loader2 className="size-5 animate-spin" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold">Preparing Session Replay</p>
            <p className="text-xs text-muted-foreground">
              Processing browser recording from Browserbase. Playback will begin shortly.
            </p>
          </div>
        </div>
      )}

      {/* Error State */}
      {(status === "error" || Boolean(error)) && (
        <div className="flex flex-col items-center justify-center gap-3 p-6 text-center text-destructive">
          <div className="flex size-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertCircle className="size-5" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold">Replay Unavailable</p>
            <p className="text-xs text-muted-foreground">{error ?? "Failed to load replay"}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRetry}
            className="mt-1 gap-1.5 text-xs text-foreground"
          >
            <RotateCcw className="size-3.5" />
            Retry
          </Button>
        </div>
      )}

      {/* Ready / Video Element */}
      <video
        ref={videoRef}
        controls={controls}
        muted={muted}
        autoPlay={autoPlay}
        playsInline
        className={cn(
          "size-full object-contain transition-opacity duration-300",
          isReady && !error ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      >
        <track kind="captions" />
      </video>
    </div>
  )
}

export default SessionReplay
