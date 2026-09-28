import { auth, currentUser } from "@clerk/nextjs/server"
import { liveblocks } from "@/lib/liveblocks"

export async function POST(request: Request) {
  const { userId, orgId } = await auth()
  const user = await currentUser()

  if (!userId || !user) {
    return new Response("Unauthorized", { status: 401 })
  }

  const name =
    user.fullName ||
    [user.firstName, user.lastName].filter(Boolean).join(" ") ||
    user.emailAddresses[0]?.emailAddress ||
    "Anonymous"

  const { status, body } = await liveblocks.identifyUser(
    {
      userId,
      groupIds: orgId ? [orgId] : [],
    },
    {
      userInfo: {
        name,
        avatar: user.imageUrl,
      },
    }
  )

  return new Response(body, { status })
}
