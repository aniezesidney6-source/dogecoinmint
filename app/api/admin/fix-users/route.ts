import { auth } from '@/lib/auth'
import { convex } from '@/lib/convex'
import { api } from '@/convex/_generated/api'

export async function GET() {
  const session = await auth()
  if (!session?.user?.isAdmin) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const result = await convex.mutation(api.users.verifyAllUsers, {})
  return Response.json({ success: true, updated: result.updated })
}
