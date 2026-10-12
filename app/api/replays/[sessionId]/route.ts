import { Browserbase } from "@browserbasehq/sdk"
import { auth } from "@clerk/nextjs/server"
import * as Sentry from "@sentry/nextjs"

interface RouteProps {
  params: Promise<{ sessionId: string }>
}

export async function GET(request: Request, { params }: RouteProps) {
  const { userId, orgId, has } = await auth()
  const { sessionId } = await params

  if (userId) {
    Sentry.setUser({ id: userId, org_id: orgId ?? undefined })
  }

  if (!orgId) {
    Sentry.logger.warn("Replay request unauthorized: missing active organization", {
      "browserbase.session_id": sessionId,
    })
    return new Response("Unauthorized", { status: 401 })
  }

  // Session replay is premium: only orgs on the pro plan can access recordings
  const isPro = has({ plan: "pro" }) || has({ plan: "org:pro" })
  if (!isPro) {
    Sentry.logger.warn("Replay request forbidden: Pro plan required", {
      "browserbase.session_id": sessionId,
      "org.id": orgId,
    })
    return new Response("Pro plan required to access session recordings", { status: 403 })
  }

  if (!sessionId) {
    return new Response("Session ID required", { status: 400 })
  }

  const apiKey = process.env.BROWSERBASE_API_KEY
  if (!apiKey) {
    Sentry.captureMessage("BROWSERBASE_API_KEY is not set in environment variables", "error")
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
        Sentry.logger.debug("Replay pages metadata empty or pending", {
          "browserbase.session_id": sessionId,
          "org.id": orgId,
        })
        return new Response("Replay not ready", { status: 404 })
      }
      pageId = meta.pages[0].pageId
    }

    // 2. Fetch the HLS VOD playlist (.m3u8) for the specific page
    const playlist = await bb.sessions.replays.retrievePage(sessionId, pageId)
    const m3u8 = await playlist.text()

    Sentry.logger.info("Session replay playlist served", {
      "browserbase.session_id": sessionId,
      "browserbase.page_id": pageId,
      "org.id": orgId,
    })

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

    if (status >= 500) {
      Sentry.captureException(err, {
        tags: { route: "api/replays" },
        extra: { sessionId, orgId, status },
      })
    } else {
      Sentry.logger.debug("Browserbase replay not ready yet", {
        "browserbase.session_id": sessionId,
        status,
        message,
      })
    }

    return new Response(message, {
      status,
      headers: {
        "Content-Type": "text/plain",
      },
    })
  }
}
