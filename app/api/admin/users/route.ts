import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { convex } from '@/lib/convex'
import { api } from '@/convex/_generated/api'
import { Id } from '@/convex/_generated/dataModel'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.isAdmin) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = req.nextUrl
  const search = searchParams.get('search') ?? undefined

  const users = await convex.query(api.users.getAllUsers, { search })
  return Response.json({ users })
}

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.isAdmin) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const { userId, balance, plan } = body as { userId: string; balance?: number; plan?: string }

  if (!userId) {
    return Response.json({ error: 'userId required' }, { status: 400 })
  }

  const fields: Record<string, unknown> = {}
  if (balance !== undefined) fields.balance = balance
  if (plan !== undefined) fields.plan = plan

  await convex.mutation(api.users.updateUser, {
    id: userId as Id<'users'>,
    fields,
  })

  const user = await convex.query(api.users.getUserById, { id: userId as Id<'users'> })
  if (!user) return Response.json({ error: 'User not found' }, { status: 404 })

  return Response.json({ user })
}
