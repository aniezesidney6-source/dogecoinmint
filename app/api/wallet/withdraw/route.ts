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
  const { amount, walletAddress } = body as { amount: number; walletAddress: string }

  if (!amount || amount < 10) {
    return Response.json({ error: 'Minimum withdrawal is 10 DOGE' }, { status: 400 })
  }
  if (!walletAddress?.trim()) {
    return Response.json({ error: 'Wallet address is required' }, { status: 400 })
  }

  const user = await convex.query(api.users.getUserById, {
    id: session.user.id as Id<'users'>,
  })
  if (!user) return Response.json({ error: 'User not found' }, { status: 404 })

  const fee = 0.5
  const total = amount + fee

  if (user.balance < total) {
    return Response.json(
      { error: `Insufficient balance. Need ${total} DOGE (${amount} + ${fee} fee)` },
      { status: 400 }
    )
  }

  await convex.mutation(api.users.updateUser, {
    id: user._id,
    fields: { balance: user.balance - total },
  })

  const [withdrawalId] = await Promise.all([
    convex.mutation(api.withdrawals.createWithdrawal, {
      userId: user._id,
      amount,
      walletAddress: walletAddress.trim(),
    }),
    convex.mutation(api.transactions.createTransaction, {
      userId: user._id,
      type: 'withdrawal',
      amount: -total,
      description: `Withdrawal to ${walletAddress.trim().slice(0, 12)}...`,
      status: 'pending',
    }),
  ])

  return Response.json({ success: true, withdrawalId })
}
