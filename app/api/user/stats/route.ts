import { auth } from '@/lib/auth'
import { convex } from '@/lib/convex'
import { api } from '@/convex/_generated/api'
import { getMarketData, getRandomHashrate, PLAN_HASHRATES } from '@/lib/mining'
import { Id } from '@/convex/_generated/dataModel'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await convex.query(api.users.getUserById, {
    id: session.user.id as Id<'users'>,
  })
  if (!user) return Response.json({ error: 'User not found' }, { status: 404 })

  const base = PLAN_HASHRATES[user.plan] ?? 45
  const noisyHashrate = getRandomHashrate(base)

  const [marketData, txResult] = await Promise.all([
    getMarketData(),
    convex.query(api.transactions.getUserTransactions, {
      userId: user._id,
      limit: 10,
    }),
  ])

  return Response.json({
    balance: user.balance,
    totalEarned: user.totalEarned,
    hashrate: noisyHashrate,
    plan: user.plan,
    miningActive: user.miningActive,
    referralCount: user.referralCount,
    referralCode: user.referralCode,
    username: user.username,
    email: user.email,
    marketData,
    transactions: txResult.transactions,
  })
}
