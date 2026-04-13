import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { convex } from '@/lib/convex'
import { api } from '@/convex/_generated/api'
import { Id } from '@/convex/_generated/dataModel'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { amount } = body as { amount: number }

  if (!amount || amount <= 0) {
    return Response.json({ error: 'Invalid amount' }, { status: 400 })
  }

  const user = await convex.query(api.users.getUserById, {
    id: session.user.id as Id<'users'>,
  })
  if (!user) return Response.json({ error: 'User not found' }, { status: 404 })

  await convex.mutation(api.users.updateUser, {
    id: user._id,
    fields: { balance: user.balance + amount },
  })

  await convex.mutation(api.transactions.createTransaction, {
    userId: user._id,
    type: 'deposit',
    amount,
    description: `Simulated deposit of ${amount} DOGE`,
    status: 'completed',
  })

  return Response.json({ success: true, balance: user.balance + amount })
}
