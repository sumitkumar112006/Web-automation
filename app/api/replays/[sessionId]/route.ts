import { Browserbase } from "@browserbasehq/sdk"
import { auth } from "@clerk/nextjs/server"

interface RouteProps {
  params: Promise<{ sessionId: string }>
}

export async function GET(request: Request, { params }: RouteProps) {
  const { orgId } = await auth()
  if (!orgId) {
    return new Response("Unauthorized", { status: 401 })
  }

  const { sessionId } = await params
  if (!sessionId) {
    return new Response("Session ID required", { status: 400 })
  }

  const apiKey = process.env.BROWSERBASE_API_KEY
  if (!apiKey) {
    return new Response("BROWSERBASE_API_KEY is not set in environment variables", {
      status: 500,
    })
  }

  const bb = new Browserbase({ apiKey })

  try {
    const url = new URL(request.url)
    const pageIdParam = url.searchParams.get("pageId")

    let pageId = pageIdParam
    if (!pageId) {
      // 1. Retrieve page metadata for the session replay
      const meta = await bb.sessions.replays.retrieve(sessionId)
      if (!meta.pages || meta.pages.length === 0) {
        return new Response("Replay not ready", { status: 404 })
      }
      pageId = meta.pages[0].pageId
    }

    // 2. Fetch the HLS VOD playlist (.m3u8) for the specific page
    const playlist = await bb.sessions.replays.retrievePage(sessionId, pageId)
    const m3u8 = await playlist.text()

    return new Response(m3u8, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.apple.mpegurl",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    })
  } catch (err: unknown) {
    // Forward Browserbase's status code (e.g., 404/422 when replay is not ready yet)
    const status =
      err && typeof err === "object" && "status" in err && typeof (err as { status: unknown }).status === "number"
        ? (err as { status: number }).status
        : 500

    const message =
      err && typeof err === "object" && "message" in err && typeof (err as { message: unknown }).message === "string"
        ? (err as { message: string }).message
        : "Replay not ready"

    return new Response(message, {
      status,
      headers: {
        "Content-Type": "text/plain",
      },
    })
  }
}
