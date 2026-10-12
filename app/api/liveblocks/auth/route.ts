import { auth, currentUser } from "@clerk/nextjs/server"
import * as Sentry from "@sentry/nextjs"
import { liveblocks } from "@/lib/liveblocks"

export async function POST(_request: Request) {
  const { userId, orgId } = await auth()
  const user = await currentUser()

  if (!userId || !user) {
    Sentry.logger.warn("Liveblocks auth rejected: unauthorized session")
    return new Response("Unauthorized", { status: 401 })
  }

  Sentry.setUser({ id: userId, org_id: orgId ?? undefined })

  const name =
    user.fullName ||
    [user.firstName, user.lastName].filter(Boolean).join(" ") ||
    user.emailAddresses[0]?.emailAddress ||
    "Anonymous"

  try {
    const { status, body } = await liveblocks.identifyUser(
      {
        userId,
        groupIds: orgId ? [orgId] : [],
        organizationId: orgId,
      },
      {
        userInfo: {
          name,
          avatar: user.imageUrl,
        },
      }
    )

    if (status >= 400) {
      Sentry.logger.warn("Liveblocks identifyUser returned non-200 status", {
        status,
        userId,
        orgId,
      })
    } else {
      Sentry.logger.info("Liveblocks user session identified", {
        userId,
        orgId,
      })
    }

    return new Response(body, { status })
  } catch (err) {
    Sentry.captureException(err, {
      tags: { route: "api/liveblocks/auth" },
      extra: { userId, orgId },
    })
    return new Response("Internal Server Error", { status: 500 })
  }
}
