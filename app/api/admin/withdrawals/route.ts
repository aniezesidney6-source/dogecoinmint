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
  const status = searchParams.get('status') ?? undefined

  const withdrawals = await convex.query(api.withdrawals.getWithdrawalsWithUsers, { status })
  return Response.json({ withdrawals })
}

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.isAdmin) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const { withdrawalId, action, adminNote } = body as {
    withdrawalId: string
    action: 'approve' | 'reject'
    adminNote?: string
  }

  if (!withdrawalId || !action) {
    return Response.json({ error: 'withdrawalId and action required' }, { status: 400 })
  }

  const withdrawal = await convex.query(api.withdrawals.getWithdrawal, {
    id: withdrawalId as Id<'withdrawals'>,
  })
  if (!withdrawal) return Response.json({ error: 'Withdrawal not found' }, { status: 404 })
  if (withdrawal.status !== 'pending') {
    return Response.json({ error: 'Withdrawal already processed' }, { status: 400 })
  }

  await convex.mutation(api.withdrawals.updateWithdrawal, {
    id: withdrawalId as Id<'withdrawals'>,
    status: action === 'approve' ? 'approved' : 'rejected',
    adminNote,
  })

  // Refund on rejection
  if (action === 'reject') {
    const user = await convex.query(api.users.getUserById, {
      id: withdrawal.userId as Id<'users'>,
    })
    if (user) {
      const refundAmount = withdrawal.amount + 0.5 // amount + fee
      await convex.mutation(api.users.updateUser, {
        id: withdrawal.userId as Id<'users'>,
        fields: { balance: user.balance + refundAmount },
      })
    }
  }

  return Response.json({ success: true })
}
