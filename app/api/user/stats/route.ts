import { auth } from '@/lib/auth'
import { convex } from '@/lib/convex'
import { api } from '@/convex/_generated/api'
import { getMarketData, getRandomHashrate, PLAN_HASHRATES } from '@/lib/mining'
import { PLAN_RATES } from '@/lib/constants'
import { Id } from '@/convex/_generated/dataModel'

// Cron runs once daily (Vercel hobby plan). The client uses earnRatePerSecond +
// lastMined to display a smoothly increasing balance without waiting for DB updates.
// Rate is calibrated to match the old every-2-min cron: PLAN_RATES[plan] / 120 s.
function getEarnRatePerSecond(plan: string, referralCount: number): number {
  const base = PLAN_RATES[plan] ?? PLAN_RATES.free
  const boost = 1 + Math.min(referralCount * 0.05, 0.5)
  return (base * boost) / 120
}

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
    lastMined: user.lastMined ?? null,
    earnRatePerSecond: user.miningActive
      ? getEarnRatePerSecond(user.plan, user.referralCount)
      : 0,
    marketData,
    transactions: txResult.transactions,
  })
}
