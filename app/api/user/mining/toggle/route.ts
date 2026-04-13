import { auth } from '@/lib/auth'
import { convex } from '@/lib/convex'
import { api } from '@/convex/_generated/api'
import { Id } from '@/convex/_generated/dataModel'

export async function POST() {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await convex.query(api.users.getUserById, {
    id: session.user.id as Id<'users'>,
  })
  if (!user) return Response.json({ error: 'User not found' }, { status: 404 })

  const newActive = !user.miningActive
  await convex.mutation(api.users.updateUser, {
    id: user._id,
    fields: { miningActive: newActive },
  })

  return Response.json({ miningActive: newActive })
}
