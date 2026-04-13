import { mutation, query } from './_generated/server'
import { v } from 'convex/values'

export const createWithdrawal = mutation({
  args: {
    userId: v.id('users'),
    amount: v.number(),
    walletAddress: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert('withdrawals', {
      ...args,
      status: 'pending',
      createdAt: Date.now(),
    })
  },
})

export const getWithdrawalsWithUsers = query({
  args: { status: v.optional(v.string()) },
  handler: async (ctx, args) => {
    let withdrawals = await ctx.db.query('withdrawals').order('desc').collect()

    if (args.status && args.status !== 'all') {
      withdrawals = withdrawals.filter((w) => w.status === args.status)
    }

    return Promise.all(
      withdrawals.map(async (w) => {
        const user = await ctx.db.get(w.userId)
        return {
          ...w,
          userId: user
            ? { _id: w.userId, username: user.username, email: user.email }
            : { _id: w.userId, username: 'Unknown', email: '' },
        }
      })
    )
  },
})

export const getWithdrawal = query({
  args: { id: v.id('withdrawals') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id)
  },
})

export const updateWithdrawal = mutation({
  args: {
    id: v.id('withdrawals'),
    status: v.union(v.literal('approved'), v.literal('rejected')),
    adminNote: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: args.status,
      adminNote: args.adminNote,
      processedAt: Date.now(),
    })
  },
})

export const getUserWithdrawals = query({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('withdrawals')
      .withIndex('by_userId', (q) => q.eq('userId', args.userId))
      .order('desc')
      .collect()
  },
})
