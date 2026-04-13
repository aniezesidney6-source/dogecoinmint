import { mutation } from './_generated/server'

const PLAN_RATES: Record<string, number> = {
  free: 0.0008,
  starter: 0.0035,
  pro: 0.0120,
  elite: 0.0380,
}

export const runMiningTick = mutation({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db
      .query('users')
      .withIndex('by_miningActive', (q) => q.eq('miningActive', true))
      .collect()

    let count = 0

    for (const user of users) {
      const rate = PLAN_RATES[user.plan] ?? PLAN_RATES.free
      const boost = 1 + Math.min(user.referralCount * 0.05, 0.5)
      const earned = parseFloat((rate * boost).toFixed(8))

      await ctx.db.patch(user._id, {
        balance: user.balance + earned,
        totalEarned: user.totalEarned + earned,
        lastMined: Date.now(),
      })

      // Record ~30% of ticks to avoid flooding transaction history
      if (Math.random() < 0.3) {
        await ctx.db.insert('transactions', {
          userId: user._id,
          type: 'mining',
          amount: earned,
          description: `Mining reward — ${user.plan} plan`,
          status: 'completed',
          createdAt: Date.now(),
        })
      }

      count++
    }

    return { processed: count }
  },
})
